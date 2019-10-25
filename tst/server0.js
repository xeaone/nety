'use strict';

const Fs = require('fs');
const Nety = require('../src');

const { Controller, HttpServer, HttpServerPayload, HttpServerNormalize } = Nety;

Promise.resolve().then(async () => {

    // const routes = {
    //     async 'get /' (context) {
    //         console.log('get /');
    //     }
    // };

    // const routes = [
    //     {
    //         path: '/',
    //         method: 'get',
    //         async handler (context) {
    //             console.log('get /');
    //         }
    //     }
    // ];

    // const cert = Fs.readFileSync('localhost-cert.pem');
    // const key = Fs.readFileSync('localhost-privkey.pem');

    // const compress = new Compress();
    const normalize = new HttpServerNormalize();
    const payload = new HttpServerPayload();

    // const router = new Router({
    //     routes,
    //     vhost: 'cats.com'
    // });

    const controller = new Controller({ debug: true, host: 'localhost' });

    const server0 = new HttpServer({ port: 8080 });
    const server1 = new HttpServer({ port: 8081 });

    await controller.handle(server0);
    await controller.handle(server1);

    await controller.plugin(normalize);
    await controller.plugin(payload);

    await controller.open();

    controller.handles.forEach(server => console.log(`Host: ${server.host}, Address: ${server.address}, Port: ${server.port}`));

}).catch(error => {
    console.log('!           TOP          !');
    console.error(error);
});
