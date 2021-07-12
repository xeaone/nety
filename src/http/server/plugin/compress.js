'use strict';

// const Os = require('os');
const Zlib = require('zlib');
const Util = require('util');
const Stream = require('stream');

// const Temporary = Os.tmpdir();
const Gzip = Util.promisify(Zlib.gzip);
const Deflate = Util.promisify(Zlib.deflate);

// console.warn('todo: compres specific files');
// console.warn('todo: cache compressed version');

module.exports = class Compress {

    buffers = new Map();

    constructor () {
        throw new Error('compress is not ready');
    }

    async handle (context) {
        // console.log('compress',context.path);

        // if (context.headers.range) return;

        const encoding = context.headers[ 'accept-encoding' ];

        if (!encoding) return;

        const body = context.body();
        const encodings = encoding.split(/\s*,\s*/);

        if (encodings.includes('deflate')) {
            // context.head('transfer-encoding', 'chunked');

            if (typeof body === 'string') {
                // context.head('content-length', '');
                context.head('content-encoding', 'deflate');
                // context.head('transfer-encoding', 'deflate');
                context.body(await Deflate(body));
            } else if (body instanceof Stream) {
                // context.head('content-length', '');
                context.head('content-encoding', 'deflate');
                // context.head('transfer-encoding', 'deflate');
                context.body(body.pipe(Zlib.createDeflate()));
            }

        } else if (encodings.includes('gzip')) {
            // context.head('transfer-encoding', 'chunked');

            if (typeof body === 'string') {
                // context.head('content-length', '');
                context.head('content-encoding', 'gzip');
                // context.head('transfer-encoding', 'gzip');
                context.body(await Gzip(body));
            } else if (body instanceof Stream) {
                // context.head('content-length', '');
                context.head('content-encoding', 'gzip');
                // context.head('transfer-encoding', 'gzip');
                context.body(body.pipe(Zlib.createGzip()));
            }

        }

    }

};
