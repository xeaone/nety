'use strict';

const Fs = require('fs');
const Nety = require('../src');
const { Controller, HttpServer } = Nety;
const { Server, Auth, Basic, Cache, Cookie, Session, Payload, Compress, Normalize, Preflight, Static } = HttpServer;

Promise.resolve().then(async () => {

    // const cert = Fs.readFileSync('localhost-cert.pem');
    // const key = Fs.readFileSync('localhost-privkey.pem');

    // const validate = async function (context, credential) {
    //     if (credential.username !== 't' || credential.password !== 't') {
    //         return { valid: false };
    //     } else {
    //         return { valid: true };
    //     }
    // };
    //
    // const basic = new HttpSessionBasic();
    // const { strategy, scheme } = basic;
    // const auth = new HttpServerAuth({ strategy, validate, scheme });

    // const validate = async function (context, credential) {
    //     const valid = await context.session.has(credential.sid);
    //     return { valid };
    // };
    //
    // const session = new Session();
    // const { strategy, scheme } = session;
    // const auth = new Auth({ strategy, validate, scheme });

    const cache = new Cache();
    const cookie = new Cookie();
    const stream = new Static();
    const payload = new Payload();
    const compress = new Compress();
    const normalize = new Normalize();
    const preflight = new Preflight();

    const server0 = new Server({ port: 8080 });
    const server1 = new Server({ port: 8081 });
    const controller = new Controller({ debug: true, host: 'localhost' });

    await controller.handle(server0);
    await controller.handle(server1);

    // await controller.plugin(session);
    // await controller.plugin(auth);
    await controller.plugin(normalize);
    // await controller.plugin(preflight);
    // await controller.plugin(cache);
    // await controller.plugin(cookie);
    // await controller.plugin(payload);
    await controller.plugin(stream);

    await controller.plugin(function test (context) {
        return context.static({
            spa: true,
            folder: './tst/static',
            path: context.url.pathname
        });
        // context.type('html').body(`<h1>Hello World<h1>`);
    });

    // await controller.plugin(compress);

    await controller.open();

    controller.handles.forEach(server => console.log(`Host: ${server.host}, Address: ${server.address}, Port: ${server.port}`));

}).catch(error => {
    console.log('!           TOP          !');
    console.error(error);
});
