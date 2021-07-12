'use strict';

const Fs = require('fs');
const Nety = require('../src');
const { HttpServer } = Nety;
// const { Controller, HttpServer } = Nety;
const { Server, Basic, Cache, Cookie, File, Payload, Normalize, Preflight, Session } = HttpServer;

Promise.resolve().then(async () => {

    // const validate = async function (context, username, password) {
    //     if (username !== 't' || password !== 't') {
    //         return { valid: false };
    //     } else {
    //         return { valid: true };
    //     }
    // };

    const secret = 'secret';
    const validate = async function (context, sid) {
        console.log(sid);
        const valid = await context.session.has(sid);
        return { valid };
    };

    const file = new File();
    const cache = new Cache();
    const cookie = new Cookie();
    const payload = new Payload();
    const normalize = new Normalize();
    const preflight = new Preflight();
    // const basic = new Basic({ validate, secret });
    const session = new Session({ validate });

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

    await server.add(session);
    // await server.add(basic);
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

    console.log(`Host: ${server.host}, Address: ${server.address}, Port: ${server.port}`);

}).catch(console.error);
