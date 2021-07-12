'use strict';

const Querystring = require('querystring');

const MB = 1e6;  // 1mb

module.exports = class Payload {

    constructor (options = {}) {
        this.maxBytes = options.maxBytes || MB;
    }

    async data (context) {
        return new Promise((resolve, reject) => {
            let chunks = '';

            context.request.setEncoding('utf8');
            context.request.on('end', () => resolve(chunks));
            context.request.on('error', (error) => reject(error));

            context.request.on('data', (chunk) => {
                if (chunks.byteLength > this.maxBytes) {
                    context.request.connection.destroy();
                    resolve(null);
                } else {
                    chunks += chunk;
                }
            });

        });
    }

    async handle (context) {

        if (context.method !== 'post') return {};

        const data = await this.data(context);

        if (data === null) return context.code(413).end();
        if (!data.length) return {};

        const type = context.request.headers[ 'content-type' ] || '';

        if (type.includes('application/json')) {
            try { return JSON.parse(data); }
            catch { return context.code(400).end(); }
        } else if (type.includes('application/x-www-form-urlencoded')) {
            try { return Querystring.parse(data); }
            catch { return context.code(400).end(); }
        }

        try { return JSON.parse(data); }
        catch { return {}; }
    }

};
