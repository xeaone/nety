'use strict';

const Os = require('os');
const Zlib = require('zlib');
const Util = require('util');

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

        const encoding = context.headers['accept-encoding'] || context.headers['Accept-Encoding'];

        if (!encoding) return;

        const encodings = encoding.split(/\s*,\s*/);

        if (encodings.includes('deflate')) {
            context.head['content-encoding'] = 'deflate';

            context.body = typeof context.body === 'string'
                ? await Defalte(context.body)
                : context.body.pipe(Zlib.createDeflate());

            return;
        }

        if (encodings.includes('gzip')) {
            context.head['content-encoding'] = 'gzip';

            context.body = typeof context.body === 'string'
                ? await Gzip(context.body)
                : context.body.pipe(Zlib.createGzip());

            return;
        }

    }

}
