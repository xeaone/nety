'use strict';

const Fs = require('fs');
const Nety = require('../src');
const { Controller, HttpServer } = Nety;
const { Server, Auth, Basic, Cache, Cookie, File, Payload, Normalize, Preflight, Session } = HttpServer;

Promise.resolve().then(async () => {

    // const validate = async function (context, credential) {
    //     if (credential.username !== 't' || credential.password !== 't') {
    //         return { valid: false };
    //     } else {
    //         return { valid: true };
    //     }
    // };

    // const basic = new Basic();
    // const { strategy, scheme } = basic;
    // const auth = new Auth({ strategy, validate, scheme });

    // const validate = async function (context, credential) {
    //     const valid = await context.session.has(credential.sid);
    //     return { valid };
    // };

    // const session = new Session();
    // const { strategy, scheme } = session;
    // const auth = new Auth({ strategy, validate, scheme });

    const file = new File();
    const cache = new Cache();
    const cookie = new Cookie();
    const payload = new Payload();
    const normalize = new Normalize();
    const preflight = new Preflight();

    const server = new Server({
        port: 8080,
        version: 2,
        debug: true,
        host: 'localhost',
        secure: {
            cert: Fs.readFileSync(`${__dirname}/localhost-cert.pem`),
            key: Fs.readFileSync(`${__dirname}/localhost-privkey.pem`)
        }
    });

    // await server.add(session);
    // await server.add(auth);
    await server.add(normalize);
    await server.add(preflight);
    await server.add(cache);
    await server.add(cookie);
    await server.add(payload);
    await server.add(file);

    await server.add([

       `get
           localhost
           /test
       `, async context => {
            console.log('get localhost /test');
        },

        'get aosd /test', async context => {
            console.log('get aosd /test');
        },

        '/test', [
            async context => {
                console.log('* * /test: one');
            },
            async context => {
                console.log('* * /test: two');
            },
        ]

    ]);

    await server.get('/', async context => {
        console.log('get /');
    });

    await server.get(async context => {
        return context.file({
            spa: true,
            folder: './tst/static',
            path: context.url.pathname
        });
        // context.type('html').body(`<h2>Hello World<h1>`).end();
    });

    await server.open();

    console.log(`Host: ${server.host}, Address: ${server.address}, Port: ${server.port}`)

}).catch(console.error);
