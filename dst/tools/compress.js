'use strict';

const Zlib = require('zlib');

module.exports = {
    name: 'compress',
    value: async function () {

        if (this.context.request.headers.range) return;

        const encoding = this.context.request.headers['accept-encoding'];

        if (!encoding) return;

        const encodings = encoding.split(/\s*,\s*/);

        if (encodings.includes('deflate')) {
            this.context.head['content-encoding'] = 'deflate';
            this.context.body = this.context.body.pipe(Zlib.createDeflate());
        }  else if (encodings.includes('gzip')) {
            this.context.head['content-encoding'] = 'gzip';
            this.context.body = this.context.body.pipe(Zlib.createGzip());
        }

        return this.context;
    }
};
