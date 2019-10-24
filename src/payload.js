'use strict';

const Querystring = require('querystring');

module.exports = class Payload {

    constructor (options = {}) {
        this.maxBytes = options.maxBytes || 1e6; // 1mb
    }

    async payload (context) {
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

        if (context.method !== 'post') return;

        const payload = await this.payload(context);

        if (payload === null) {
            return context.code(413).end();
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
