'use strict';

// preflight CORS CORBS

module.exports = class Preflight {

    constructor (options = {}) {
        this.origin = options.origin
        this.age = options.age || 31536000;
        this.credentials = options.credentials || 'true';
        this.expose = options.expose || 'WWW-Authenticate, Server-Authorization';
        this.headers = options.headers || 'Content-Type, Authorization, X-Frame-Options';
        this.methods = options.methods || 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD';
    }

    async handle (context) {

        context.head['access-control-max-age'] = this.age;
        context.head['access-control-expose-headers'] = this.expose;
        context.head['access-control-allow-headers'] = this.headers;
        context.head['access-control-allow-methods'] = this.methods;
        context.head['access-control-allow-credentials'] = this.credentials;
        context.head['access-control-allow-origin'] = this.origin || context.url.hostname;

        if (context.method !== 'options') return;

        // might need to check the following headers
        // Access-Control-Request-Method, Access-Control-Request-Headers, Origin

        context.code = 204;
        context.end();
    }

}
