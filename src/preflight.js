'use strict';

// preflight CORS CORBS

module.exports = class Preflight {

    constructor (options) {
        options = options || {};
        this.origin = options.origin
        this.age = options.age || 31536000;
        this.credentials = options.credentials || 'true';
        this.expose = options.expose || 'WWW-Authenticate, Server-Authorization';
        this.headers = options.headers || 'Content-Type, Authorization, X-Frame-Options';
        this.methods = options.methods || 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD';
    }

    async handler (context) {

        this.context.head['access-control-max-age'] = this.age;
        this.context.head['access-control-expose-headers'] = this.expose;
        this.context.head['access-control-allow-headers'] = this.headers;
        this.context.head['access-control-allow-methods'] = this.methods;
        this.context.head['access-control-allow-credentials'] = this.credentials;
        this.context.head['access-control-allow-origin'] = this.origin || context.url.hostname;

        if (context.method !== 'options') return;

        // might need to check the following headers
        // Access-Control-Request-Method, Access-Control-Request-Headers, Origin

        context.code = 204;
        context.message = context.instance.status[context.code];
        context.response.writeHead(context.code, context.head);
        context.response.end();
    }

}
