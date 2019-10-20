'use strict';

const Fs = require('fs');
const Nety = require('../src');
const Router = require('../src/router.js');
const Compress = require('../src/compress.js');
const Payloader = require('../src/payloader.js');
const Normalizer = require('../src/normalizer.js');

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

    const debug = process.env.DEBUG;
    const hostname = debug ? 'localhost' : undefined;

    const server0 = new Nety.HttpServer({ port: 8080, hostname });
    const server1 = new Nety.HttpServer({ port: 8081, hostname });

    // const compress = new Compress();
    const payloader = new Payloader();
    const normalizer = new Normalizer();

    // const router = new Router({
    //     routes,
    //     vhost: 'cats.com'
    // });

    const manager = new Nety.Controller({ debug });

    await manager.server(server0);
    await manager.server(server1);

    await manager.plugin(normalizer);
    await manager.plugin(payloader);

    // manager.on('error', console.error);
    // manager.on('handler:error', console.error);
    // manager.on('listener:error', console.error);

    await manager.open();

    manager.servers.forEach(server => console.log(`Host: ${server.host}, Address: ${server.address}, Port: ${server.port}`));

}).catch(error => {
    console.log('!           TOP          !');
    // console.error(error);
});
