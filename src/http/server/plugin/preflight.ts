// preflight CORS CORBS

import type Context from '../context.js';

export interface PreflightOptions {
    origin?: string;
    age?: number;
    credentials?: string;
    expose?: string;
    headers?: string;
    methods?: string;
}

export default class Preflight {
    origin: string | undefined = undefined;
    age = 31536000;
    credentials = 'true';
    expose = 'WWW-Authenticate, Server-Authorization';
    headers = 'Content-Type, Authorization, X-Frame-Options';
    methods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD';

    constructor(options: PreflightOptions = {}) {
        Object.assign(this, options);
    }

    async handle(context: Context) {
        context.head('access-control-max-age', this.age);
        context.head('access-control-expose-headers', this.expose);
        context.head('access-control-allow-headers', this.headers);
        context.head('access-control-allow-methods', this.methods);
        context.head('access-control-allow-credentials', this.credentials);
        context.head('access-control-allow-origin', this.origin || context.url.hostname);

        if (context.method !== 'options') return;

        // might need to check the following headers
        // Access-Control-Request-Method, Access-Control-Request-Headers, Origin

        await context.code(204).end();
    }
}
