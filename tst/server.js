'use strict';

// const Fs = require('fs');
// const Url = require('url');
// const Util = require('util');
// const Path = require('path');
// const Toked = require('toked');
// const Jwt = require('jsonwebtoken');
const Servey = require('../src/server');

// const JwtSign = Util.promisify(Jwt.sign);

const USERNAME = 't';
const PASSWORD = 't';
// const EMAIL = 't@t.t';
const SECRET = 'secret';

(async function () {

    const routes = [
        {
            path: '/payload',
            method: 'post',
            options: {
                auth: false
            },
            handler: async function (context) {
                console.log(context.payload);
            }
        },
        // {
        //     path: '/toked',
        //     method: 'get',
        //     options: {
        //         auth: {
        //             secret: SECRET,
        //             tool: 'toked',
        //             scheme: 'cookie',
        //             validate: async function (context, credential) {
        //                 return { valid: true, credential };
        //             }
        //         }
        //     },
        //     handler: async function (context) {
        //         return {
        //             body: context.credential
        //         };
        //     }
        // },
        {
            path: '/session',
            method: 'get',
            options: {
                auth: {
                    secret: SECRET,
                    tool: 'session',
                    validate: async function (context, credential) {
                        const user = await context.tool.session.get(credential.decoded);
                        if (user) {
                            return { valid: true, credential: user };
                        } else {
                            return { valid: false };
                        }
                    }
                }
            },
            handler: async function (context) {
                return {
                    body: context.credential
                };
            }
        },
        {
            path: '/basic',
            method: 'get',
            options: {
                auth: {
                    tool: 'basic',
                    validate: async function (context, credential) {
                        if (credential.decoded.username === USERNAME && credential.decoded.password === PASSWORD) {
                            return { valid: true, credential: { username: credential.decoded.username } };
                        } else {
                            return { valid: false };
                        }
                    }
                }
            },
            handler: async function () {
                return {
                    body: 'basic'
                };
            }
        },
        {
            path: '/sign-in',
            method: [ 'get','post' ],
            handler: async function (context) {
                const head = {};

                if (context.method === 'POST') {

                    if (context.payload.username !== USERNAME || context.payload.password !== PASSWORD) {
                        return context.tool.status.unauthorized();
                    }

                    const exp = Math.floor(Date.now() / 1000) + 60;

                    const cookie = await context.tool[context.payload.type].create({ exp, username: USERNAME }, SECRET);

                    context.tool.head.cookie(context, cookie);

                    return {
                        body: {
                            cookie: cookie,
                            payload: context.payload
                        }
                    };
                }

                head['content-type'] = 'text/html;charset=utf-8';

                return {
                    head,
                    body: `
						<h1>Sign In</h1>
						<form method="post" action="/sign-in">
							<input name="username" type="text" placeholder="Username" required><br>
							<input name="password" type="text" placeholder="Password" required><br>
							<input name="type" type="radio" value="session" required>Session<br>
							<input name="type" type="radio" value="toked" required>Toked<br>
							<input type="submit" value="Send"/>
						</form>
					`
                };
            }
        },
        {
            path:'/(*)',
            method: 'get',
            options: {
                vhost: [ 'localhost:8080', 'testcom.localhost:8080' ]
            },
            async handler (context) {
                return context.tool.static({
                    spa: true,
                    folder: './tst/static',
                    path: context.url.pathname
                });
            }
        }
    ];

    const server = new Servey({
        port: 8080,
        debug: true,
        // cache: false,
        hostname: 'localhost',
        // tools: [
        //     Toked
        // ],

        // tool: {
        options: {
            cookie: {
                secret: SECRET
            },
            cache: {
                control: true
            }
        },
        routes: routes,
        event: {
            handler: {
                before () {
                    // console.log('before');
                },
                after () {
                    // console.log('after');
                }
            }
        }
        // auth: {
        // 	type: 'basic',
        // 	type: 'basic',
        // 	validate: async function (context, data) {
        // 		if (data.username === 'foo' && data.password === 'bar') {
        // 			return { valid: true, credential: { username: 'foo'} };
        // 		} else {
        // 			return { valid: false };
        // 		}
        // 	}
        // }
    });

    server.on('error', function (error) {
        // console.log('error');
        console.error(error);
    });

    server.on('request', function (context) {
        // console.log(context.url);
        console.log('request');
    });

    server.on('open', function () {
        // console.log('open');
    });

    server.on('close', function () {
        // console.log('close');
    });

    await server.open();

    console.log(server.port);

}()).catch(function (error) {
    console.log('here');
    console.error(error);
});
