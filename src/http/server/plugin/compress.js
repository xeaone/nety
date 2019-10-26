'use strict';

const Os = require('os');
const Zlib = require('zlib');
const Util = require('util');
const Stream = require('stream');

const Temporary = Os.tmpdir();
const Gzip = Util.promisify(Zlib.gzip);
const Defalte = Util.promisify(Zlib.deflate);

module.exports = class Compress {

    constructor (options = {}) {
        console.warn('todo: compres specific files');
        console.warn('todo: cache compressed version');
        this.buffers = new Map();
    }

    async handle (context) {

        if (context.headers.range) return;

        const encoding = context.headers['accept-encoding'];

        if (!encoding) return;

        const body = context.body();
        const encodings = encoding.split(/\s*,\s*/);

        if (encodings.includes('deflate')) {

            if (typeof body === 'string') {
                context.head('content-encoding', 'deflate');
                context.body(await Defalte(body));
            } else if (body instanceof Stream.Readable) {
                context.head('content-encoding', 'deflate');
                context.body(body.pipe(Zlib.createDeflate()));
            }

        } else if (encodings.includes('gzip')) {

            if (typeof body === 'string') {
                context.head('content-encoding', 'gzip');
                context.body(await Gzip(body));
            } else if (body instanceof Stream.Readable) {
                context.head('content-encoding', 'gzip');
                context.body(body.pipe(Zlib.createGzip()));
            }

        }

    }

}
