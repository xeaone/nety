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

    // const compress = new Compress();
    const payloader = new Payloader();
    const normalizer = new Normalizer();

    // const router = new Router({
    //     routes,
    //     vhost: 'cats.com'
    // });

    const server0 = new Nety.HttpServer({ port: 8080, host: 'localhost', debug: true });
    const server1 = new Nety.HttpServer({ port: 8081, host: 'localhost', debug: true });

    await server0.plugin(normalizer);
    await server0.plugin(payloader);

    await server1.plugin(normalizer);
    await server1.plugin(payloader);

    await server0.open();
    await server1.open();

    console.log(`Host: ${server0.host}, Address: ${server0.address}, Port: ${server0.port}`);
    console.log(`Host: ${server1.host}, Address: ${server1.address}, Port: ${server1.port}`);

}).catch(error => {
    console.log('!           TOP          !');
    console.error(error);
});
