'use strict';

const Querystring = require('querystring');

module.exports = class Payloader {

    constructor (options) {
        options = options || {};
        this.maxBytes = options.maxBytes || 1e6; // 1mb
    }

    async payloader (context) {
        const self = this;
        return new Promise(function (resolve, reject) {
            const chunks = [];

            context.request.on('error', reject);

            context.request.on('data', function (chunk) {
                if (chunks.byteLength > self.maxBytes) {
                    context.request.connection.destroy();
                    resolve(null);
                } else {
                    chunks.push(chunk);
                }
            });

            context.request.on('end', function () {
                resolve(chunks);
            });

        });
    }

    async handler (context) {
        const self = this;

        if (context.method !== 'post') return;

        const payload = await self.payloader(context);

        if (payload === null) {
            context.response.writeHead(413);
            context.response.end('payloader max bytes');
            return;
        }

        context.payload = payload.toString();

        if (context.payload) {

            if (context.headers['content-type'].includes('application/json')) {
                context.payload = JSON.parse(context.payload);
            }

            if (context.headers['content-type'].includes('application/x-www-form-urlencoded')) {
                context.payload = Querystring.parse(context.payload);
            }

        }

    }


}
