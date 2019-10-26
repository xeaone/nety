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

        let data = await this.data(context);

        if (data === null) {
            context.code(413).end();
            return {};
        }

        const type = context.request.headers['content-type'];

        data = data.toString();

        if (type.includes('application/json')) {
            data = JSON.parse(data || '{}');
        } else if (type.includes('application/x-www-form-urlencoded')) {
            data = Querystring.parse(data);
        }

        return data || {};
    }

}
