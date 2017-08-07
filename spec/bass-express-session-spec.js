/*
 * This file is part of the bass-express-session module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const path = require('path');
const express = require('express');
const request = require('request');
const logger = require('log4js').getLogger();

const { Bass } = require('bass');

const session = require('express-session');
const BassStore = require('../index.js')(session);

process.on('unhandledRejection', (reason, p) => {
    console.error(p, reason);
    throw reason;
});

describe("Session", () => {

    let server;

    beforeAll((done) => {

        const bass = new Bass({

            logging: { logger },

            // register bass.js adapter(s)
            adapters: [
                path.join(__dirname, '..', 'node_modules', 'bass-nedb')
            ],

            // configure connection info
            connections: {
                'nedb.default': {
                    adapter: 'bass-nedb',
                    //directory: path.join(__dirname, 'tmp')
                }
            },

            // configure the managers
            managers: {
                'nedb.default' : {
                    adapter: 'bass-nedb',
                    connection: 'nedb.default',
                    documents: {

                        // directory of annotated document classes
                        "test": path.join(__dirname, 'document')

                    }
                }
            }
        });

        bass.init().then(() => {

            const app = express();

            app.use(session({
                secret: 'my-secret',
                store: new BassStore({
                    ttl: 10,    // 10 seconds
                    bass: bass,
                    manager: 'nedb.default',
                    document: 'Session',
                    expireField: 'expiresAt',
                    dataField: 'data',
                    sidField: 'sid'
                })
            }));

            app.get('/set-session-value', (req, res) => {
                req.session.foo = 'go bass!!!';
                res.send('session data was set');
            });

            app.get('/get-session-value', (req, res) => {
                res.send(req.session.foo);
            });

            app.get('/clear-session-value', (req, res) => {
                delete req.session.foo;
                res.send('session data was deleted');
            });

            server = app.listen(3000, () => {
                //console.log('server started');
                done();
            });

        }).catch(err => { throw err });

    });

    afterAll((done) => {
        server && server.close();
        done();
    });

    it("should set, read and remove a session value", (done) => {

        request({
            uri: 'http://localhost:3000/set-session-value',
            method: 'GET',
            jar: true
        }, (error, response, body) => {

            expect(body).toEqual('session data was set');

            request({
                uri: 'http://localhost:3000/get-session-value',
                method: 'GET',
                jar: true
            }, (error, response, body) => {

                expect(body).toEqual('go bass!!!');

                request({
                    uri: 'http://localhost:3000/clear-session-value',
                    method: 'GET',
                    jar: true
                }, (error, response, body) => {

                    expect(body).toEqual('session data was deleted');

                    request({
                        uri: 'http://localhost:3000/get-session-value',
                        method: 'GET',
                        jar: true
                    }, (error, response, body) => {

                        expect(body).toEqual('');

                        done();

                    });

                });

            });

        });

    });

});