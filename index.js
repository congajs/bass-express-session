/*
 * This file is part of the bass-express-session module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


/**
 * express-session store module function factory
 * @param {Object} session The express session object
 * @return {BassStore} class
 */
module.exports = session => class BassStore extends session.Store {
    /**
     *
     * @param {Object} options
     */
    constructor(options) {

        const {
            ttl,
            prefix,
            bass,
            manager,
            document,
            expireField,
            dataField,
            sidField
        } = options;

        super(options);

        this.prefix = prefix === null || prefix === undefined ? 'sess' : prefix;

        this.bass = bass;

        this.hasTtl = ttl === false || ttl === 0;
        this.ttl = ttl;

        if (typeof bass.createSession === 'function') {
            this.bass = bass.createSession();
        }

        this.manager = this.bass.getManager(manager);

        this.document = document;
        this.expireField = expireField;
        this.dataField = dataField;
        this.sidField = sidField;

        // bass should already be connected (persistent), emit connect right away
        this.emit('connect');

    }

    /**
     * Get the sid with the prefix attached
     *
     * @param {String} sid
     * @returns {String}
     */
    psid(sid) {
        return this.prefix + sid;
    }

    /**
     * Create a new empty session document
     * @param {String} psid The session id, already prefixed
     * @returns {Object}
     */
    createDocument(psid) {
        return this.manager.createDocument(this.document, {
            [this.sidField]: psid,
            [this.dataField]: {}
        });
    }

    /**
     * Get the configured TTL
     *
     * @param {String} sid
     * @param {Object} session
     * @returns {Number}
     */
    getTtl(sid, session) {
        if (!isNaN(this.ttl)) {
            return this.ttl;
        }
        if (typeof this.ttl === 'function') {
            return this.ttl(this, sid, session);
        }
        return 0;
    }

    /**
     * Get find-by criteria
     *
     * @param {Object} [criteria] Criteria to start with
     * @param {Date} [expireDate] The date to check expireField against
     * @returns {Object}
     */
    criteria(criteria = {}, expireDate = new Date()) {
        if (this.expireField && this.hasTtl) {
            criteria[this.expireField] = {'$gt': expireDate};
        }
        return criteria;
    }

    /**
     * This optional method is used to get all sessions in the store as an array.
     * The callback should be called as callback(error, sessions).
     *
     * @param {Function} callback
     */
    all(callback) {
        this.manager.findBy(this.document, this.criteria()).then(documents => {

            callback(null, documents.map(document => document[this.dataField]));

        }).catch(err => callback(err));
    }

    /**
     * This required method is used to get a session from the store given a session ID (sid).
     * The callback should be called as callback(error, session).
     *
     * @param sid
     * @param callback
     */
    get(sid, callback) {
        const psid = this.psid(sid);
        this.manager.findOneBy(this.document, this.criteria({
            [this.sidField]: psid
        })).then(document => {
            if (!document) {
                callback();
                return;
            }
            callback(null, document[this.dataField]);
        }).catch(err => callback(err));
    }

    /**
     * This required method is used to upsert a session into the store given a session ID (sid)
     * and session (session) object. The callback should be called as callback(error) once the
     * session has been set in the store.
     *
     * @param sid
     * @param session
     * @param callback
     */
    set(sid, session, callback) {
        const psid = this.psid(sid);
        this.manager.findOneBy(this.document, this.criteria({

            [this.sidField]: psid

        })).then(document => {
            if (!document) {
                document = this.createDocument(psid);
            }

            if (this.expireField && this.hasTtl) {
                let d = new Date();
                d.setTime(d.getTime() + (this.getTtl(sid, session) * 1000));
                document[this.expireField] = d;
            }

            document[this.dataField] = session;

            this.manager.persist(document);

            this.manager.flush(document).then(() => {

                callback(null, session);

            }).catch(err => callback(err));
        });
    }

    /**
     * This required method is used to destroy/delete a session from the store given a session ID
     * The callback should be called as callback(error) once the session is destroyed.
     *
     * @param {String|Array<{String}>} sid
     * @param {Function} callback
     */
    destroy(sid, callback) {
        if (!Array.isArray(sid)) {
            sid = [sid];
        }
        Promise.all(

            // map sid's to removeBy promises
            sid.map(id => this.manager.removeBy(this.document, {[this.sidField]: this.psid(id)}))

        ).then(data => {

            // when all sid's are removed, callback
            callback(null);

        }).catch(err => callback(err));
    }

    /**
     * This optional method is used to delete all sessions from the store.
     * The callback should be called as callback(error) once the store is cleared.
     *
     * @param {Function} callback
     */
    clear(callback) {
        this.manager.removeBy(this.document, {}).then(() => {

            callback();

        }).catch(err => callback(err));
    }

    /**
     * This optional method is used to get the count of all sessions in the store.
     * The callback should be called as callback(error, len).
     *
     * @param callback
     */
    length(callback) {
        this.manager.findCountBy(this.document, this.criteria())
            .then(count => callback(null, count))
            .catch(err => callback(err));
    }

    /**
     * This recommended method is used to "touch" a given session given a session ID (sid) and
     * session (session) object.
     *
     * The callback should be called as callback(error) once the session has been touched.
     *
     * This is primarily used when the store will automatically delete idle sessions and this
     * method is used to signal to the store the given session is active, potentially resetting
     * the idle timer.
     *
     * @param {String|Array<String>} sid
     * @param {Object} session
     * @param {Function} callback
     */
    touch(sid, session, callback) {
        if (!this.expireField || !this.hasTtl) {
            callback(null);
            return;
        }
        if (!Array.isArray(sid)) {
            sid = [sid];
        }
        this.manager.findWhereIn(
            this.document,
            this.sidField,
            sid.map(id => this.psid(id))
        ).then(documents => {

            if (!documents || documents.length === 0) {
                callback(null);
                return;
            }

            for (let document of documents) {
                let d = new Date();
                d.setTime(d.getTime() + (this.getTtl(id, session) * 1000));

                document[this.expireField] = d;

                this.manager.persist(document);
            }

            return this.manager.flush().then(() => callback(null));

        }).catch(err => callback(err));
    }
};