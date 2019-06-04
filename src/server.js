'use strict';

// const Fs = require('fs');
// const Path = require('path');
// const Util = require('util');
const Url = require('url');
// const Zlib = require('zlib');
const Http = require('http');
const Https = require('https');
const Events = require('events');
const Stream = require('stream');
const Buffer = require('buffer').Buffer;
const Querystring = require('querystring');

const Tool = require('./tool');
const Option = require('./option');
const Utility = require('./utility');

module.exports = class Servey extends Events {

    constructor (options) {
        super();

        options = options || {};

        if (options.listener) {
            options.listener.on('request', this.callback.bind(this));
        } else if (options.secure) {
            options.listener = Https.createServer(options.secure, this.callback.bind(this));
        } else {
            options.listener = Http.createServer(this.callback.bind(this));
        }

        Option.call(this, options);
        Tool.call(this, options);
    }

    callback (request, response) {
        const self = this;

        try {
            self.handler(request, response);
        } catch (error) {
            self.emit('error', error);
            self.ender({
                code: 500, request: request, response: response,
                message: self.debug ? error.message : 'internal server error'
            });
        }

    }

    async router (context) {
        const routes = this.routes;
        const method = context.method;
        const path = context.url.pathname;

        for (const route of routes) {
            if (
                (
                    route.path === '*' ||
                    route.path === '/*' ||
    				route.path === path
                ) &&
				Utility.methodNormalize(route.method).includes(method)
            ) {
                return route;
            }
        }

        return null;
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

    async streamer (context) {
        return new Promise(function (resolve, reject) {
            context.body
                .pipe(context.response)
                .on('end', resolve)
                .on('error', reject);
        });
    }

    async ender (context) {
        const self = this;

        if (!context.head) {
            context.head = {};
        }

        if (!context.code) {
            context.code = 200;
        }

        if (!context.message) {
            context.message = Http.STATUS_CODES[context.code];
        }

        if (!context.body) {
            context.body = {
                code: context.code,
                message: context.message || Http.STATUS_CODES[context.code]
            };
        }

        context.head['content-type'] = `${self.contentType};${self.charset}`;

        // await context.tool.head.cache();
        // await context.tool.head.security();

        if (context.body instanceof Stream.Readable) {
            const mime = await Utility.getMime(context.body.path);
            context.head['content-type'] = `${mime};${self.charset}`;

            // await context.tool.compress();

            context.response.writeHead(context.code, context.message, context.head);

            await self.streamer(context);

            return;
        }

        if (typeof context.body === 'object') {
            const mime = await Utility.getMime('json');
            context.head['content-type'] = `${mime};${self.charset}`;
            context.body = JSON.stringify(context.body);
        }

        context.head['content-length'] = Buffer.byteLength(context.body);
        context.response.writeHead(context.code, context.message, context.head);
        context.response.end(context.body);
    }

    async handler (request, response) {
        const self = this;

        self.emit('request', request);

        const method = request.method;
        const url = Url.parse(request.url);
        const query = Querystring.parse(url.query);
        const tool = Object.create(self.tool);

        const context = {
            url,
            tool,
            query,
            method,
            request,
            response,
            head: {},
            // code: 200,
            code: null,
            message: null,
            body: null,
            instance: self,
            credential: null,
            options: Object.assign({}, self.options, {
                auth: self.auth,
                cors: self.cors,
                cache: self.cache
            })
        };

        context.tool.context = context;

        const route = await self.router(context);

        context.options = Object.assign({}, route && route.options ? route.options : {});

        await context.tool.cache(context.options.cache);
        await context.tool.head.security();

        if (context.options.auth) {

            await context.tool.auth(context.options.auth);

            if (context.code !== 200) {
                return self.ender(context);
            }

            if (!context.credential) {
                context.code = 500;
                context.message = 'auth tool credential required';
                return self.ender(context);
            }

        }

        if (context.options.vhost) {
            const vhosts = [].concat(context.options.vhost);
            const hostname = request.headers.host;

            if (!vhosts.includes(hostname)) {
                context.code = 404;
                return self.ender(context);
            }

        }

        if (context.url.pathname !== '/' && context.url.pathname.slice(-1) === '/') {
            const pathname = context.url.pathname.replace(/\/+/, '/').slice(0, -1) || '/';
            const location = `${pathname}${context.url.search || ''}${context.url.hash || ''}`;
            await context.tool.redirect(location);
            return self.ender(context);
        }

        // preflight CORS CORBS
        if (context.method.includes('OPTIONS')) {
            // await context.tool.head.security();

            context.code = 204;
            context.message = Http.STATUS_CODES[204];
            context.response.writeHead(context.code, context.message, context.head);
            context.response.end();

            return;
        }

        if (!route) {
            context.code = 404;
            return self.ender(context);
        }

        if (!route.handler) {
            context.code = 500;
            context.message = 'route handler required';
            return self.ender(context);
        }

        if (typeof route.handler !== 'function') {
            context.code = 500;
            context.message = 'route handler requires function';
            return self.ender(context);
        }

        if (context.method.includes('POST')) {
            const payload = await self.payloader(context);

            if (payload === null) {
                context.code = 413;
                return self.ender(context);
            }

            context.payload = payload.toString();

            if (context.payload) {

                if (context.request.headers['content-type'].includes('application/json')) {
                    context.payload = JSON.parse(context.payload);
                }

                if (context.request.headers['content-type'].includes('application/x-www-form-urlencoded')) {
                    context.payload = Querystring.parse(context.payload);
                }

            }

        }

        if (self.event && self.event.handler) {
            if (typeof self.event.handler === 'function') {
                await self.event.handler(context);
            } else if (typeof self.event.handler.before === 'function') {
                await self.event.handler.before(context);
            }
        }

        const result = await route.handler(context);
        Object.assign(context, result);

        if (self.event && self.event.handler) {
            if (typeof self.event.handler === 'function') {
                await self.event.handler(context);
            } else if (typeof self.event.handler.after === 'function') {
                await self.event.handler.after(context);
            }
        }

        await self.ender(context);
    }

    async open () {
        const self = this;
        return new Promise(function (resolve) {
            const options = { port: self.port, host: self.hostname };
            self.listener.listen(options, function () {
                Object.assign(self.information, self.listener.address());
                self.emit('open');
                resolve();
            });
        });
    }

    async close () {
        const self = this;
        return new Promise(function (resolve) {
            self.listener.close(function () {
                self.emit('close');
                resolve();
            });
        });
    }

};
