import Querystring from 'node:querystring';
import type Context from '../context.js';

export interface PayloadOptions {
    maxBytes?: number;
}

const MB = 1e6; // 1mb

export default class Payload {
    maxBytes = MB;

    constructor(options: PayloadOptions = {}) {
        Object.assign(this, options);
    }

    async data(context: Context): Promise<string | null> {
        return new Promise<string | null>((resolve, reject) => {
            let chunks = '';

            context.request.setEncoding('utf8');
            context.request.on('end', () => resolve(chunks));
            context.request.on('error', (error: Error) => reject(error));

            context.request.on('data', (chunk: Buffer | string) => {
                if (Buffer.byteLength(chunks + chunk) > this.maxBytes) {
                    context.request.destroy();
                    resolve(null);
                } else {
                    chunks += chunk;
                }
            });
        });
    }

    async handle(context: Context) {
        if (context.method !== 'post') return {};

        const data = await this.data(context);

        if (data === null) return context.code(413).end();
        if (!data.length) return {};

        const contentType = context.request.headers['content-type'];
        const type = (Array.isArray(contentType) ? contentType[0] : contentType) || '';

        if (type.includes('application/json')) {
            try {
                return JSON.parse(data);
            } catch {
                return context.code(400).end();
            }
        } else if (type.includes('application/x-www-form-urlencoded')) {
            try {
                return Querystring.parse(data);
            } catch {
                return context.code(400).end();
            }
        }

        try {
            return JSON.parse(data);
        } catch {
            return {};
        }
    }
}
