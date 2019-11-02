'use strict';

const Querystring = require('querystring');

module.exports = class Payload {

    constructor (options = {}) {
        this.maxBytes = options.maxBytes || 1e6; // 1mb
    }

    async data (context) {
        return new Promise((resolve, reject) => {
            const chunks = [];

            context.request.on('end', () => resolve(chunks));
            context.request.on('error', (error) => reject(error));

            context.request.on('data', (chunk) => {
                if (chunks.byteLength > this.maxBytes) {
                    context.request.connection.destroy();
                    resolve(null);
                } else {
                    chunks.push(chunk);
                }
            });

        });
    }

    async handle (context) {

        if (context.method !== 'post') return {};

        const data = await this.data(context);

        if (data === null) return context.code(413).end();

        const type = context.request.headers['content-type'] || '';

        if (type.includes('application/json')) {
            try { return JSON.parse(data); }
            catch { return context.code(400).end(); }
        } else if (type.includes('application/x-www-form-urlencoded')) {
            try { return Querystring.parse(data) }
            catch { return context.code(400).end(); }
        }

        try { return JSON.parse(data); }
        catch { return {}; }
    }

}
