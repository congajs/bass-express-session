/*
 * This file is part of the bass-express-session module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * @Bass:Document(collection="sessions")
 * @Rest:Resource(type="sessions")
 */
module.exports = class Session {

    /**
     *
     * @constructor
     */
    constructor() {

        /**
         * @Bass:Id
         * @Bass:Field(type="ObjectID", name="_id")
         * @Rest:ID
         */
        this.id = null;

        /**
         * @Bass:Field(type="String", name="session_id")
         * @Rest:Attribute
         */
        this.sid = null;

        /**
         * @Bass:Field(type="Object", name="data")
         * @Rest:Attribute
         */
        this.data = {};

        /**
         * @Bass:Version
         * @Bass:Field(type="Number", name="version")
         * @Rest:Attribute
         */
        this.version = 0;

        /**
         * @Bass:Field(type="Date", name="expires_at")
         * @Rest:Attribute
         */
        this.expiresAt = null;

        /**
         * @Bass:CreatedAt
         * @Bass:Field(type="Date", name="created_at")
         * @Rest:Attribute
         */
        this.createdAt = null;

        /**
         * @Bass:UpdatedAt
         * @Bass:Field(type="Date", name="updated_at")
         * @Rest:Attribute
         */
        this.updatedAt = null;

    }

};