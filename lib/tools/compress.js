'use strict';

const Zlib = require('zlib');

module.exports = {
    name: 'compress',
    value: async function () {

        if (this.context.request.headers.range) {
            this.context.code = 206;
            // can this be compressed
        } else {
            const encoding = this.context.request.headers['accept-encoding'];

            this.context.code = 200;

            if (/\bdeflate\b/.test(encoding)) {
                this.context.head['content-encoding'] = 'deflate';
                this.context.body = this.context.body.pipe(Zlib.createDeflate());
            }  else if (/\bgzip\b/.test(encoding)) {
                this.context.head['content-encoding'] = 'gzip';
                this.context.body = this.context.body.pipe(Zlib.createGzip());
            }

        }

        return this.context;
    }
};
