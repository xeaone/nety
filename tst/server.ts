import Fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { Basic, Cache, Cookie, File, Payload, Normalize, Preflight, Session, HttpServer } from '../src/index.js';

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

const server = new HttpServer({
    port: 8080,
    // version: 2,
    debug: true,
    host: 'localhost',
    // secure: {
    //     cert: Fs.readFileSync(fileURLToPath(new URL('../localhost-cert.pem', import.meta.url))),
    //     key: Fs.readFileSync(fileURLToPath(new URL('../localhost-privkey.pem', import.meta.url))),
    // },
});

server.add(session);
// server.add(basic);
server.add(normalize);
server.add(preflight);
server.add(cache);
server.add(cookie);
server.add(payload);
server.add(file);

// server.add([
//     `get localhost /test`,
//     async (context) => {
//         console.log('get localhost /test');
//     },

//     'get aosd /test',
//     async (context) => {
//         console.log('get aosd /test');
//     },

//     '/test',
//     [
//         async (context) => {
//             console.log('* * /test: one');
//         },
//         async (context) => {
//             console.log('* * /test: two');
//         },
//     ],
// ]);

server.get('/', async (context) => {
    console.log('get /');
});

server.get('*', async (context) => {
    return context.file({
        spa: true,
        folder: './tst/static',
        path: context.url.pathname,
    });
    // context.type('html').body(`<h2>Hello World<h1>`).end();
});

await server.open();

console.log(`Host: ${server.host}, Address: ${server.address}, Port: ${server.port}`);
