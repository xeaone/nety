'use strict';

const Http = require('http');
const Https = require('https');
const Url = require('url').URL;
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
        try {
            this.handler(request, response);
        } catch (error) {
            this.emit('error', error);
            this.ender({
                code: 500, request: request, response: response,
                message: this.debug ? error.message : 'internal server error'
            });
        }
    }

    async router (context) {
        const routes = this.routes;
        const method = context.method;
        const path = context.url.pathname;

        for (const route of routes) {
            if (Utility.compareMethod(route.method, method) && Utility.comparePath(route.path, path)) {
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
                message: context.message
            };
        }

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

        if (!context.head['content-type']) {
            context.head['content-type'] = `${self.contentType};${self.charset}`;
        }

        if (!context.head['content-length']) {
            context.head['content-length'] = Buffer.byteLength(context.body);
        }

        context.response.writeHead(context.code, context.message, context.head);
        context.response.end(context.body);
    }

    async handler (request, response) {
        const self = this;

        self.emit('request', request);

        const path = request.url;
        const method = request.method;
        const host = request.headers.host;
        const protocol = self.secure ? 'https' : 'http';
        const url = new Url(path, `${protocol}:${host}`);
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
            body: null,
            code: null,
            options: {},
            message: null,
            instance: self,
            credential: null
        };

        context.tool.context = context;

        context.options = Object.assign(self.options || {}, {
            www: self.www,
            auth: self.auth,
            cors: self.cors,
            cache: self.cache,
            secure: self.secure
        });

        const route = await self.router(context);

        await context.tool.cache(context.options.cache);
        await context.tool.head.security();

        if (route) {
            context.options = Object.assign(context.options, route.options ? route.options : {});

            if (route.auth !== undefined && route.auth !== null) {
                context.options.auth = route.auth;
            }

            if (route.cors !== undefined && route.cors !== null) {
                context.options.cors = route.cors;
            }

            if (route.cache !== undefined && route.cache !== null) {
                context.options.cache = route.cache;
            }

        }

        if (context.options.www && context.url.hostname.startsWith('www.')) {
            context.url.pathname = context.url.pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
            context.url.hostname = context.url.hostname.slice(4);
            await context.tool.redirect(context.url.href);
            return self.ender(context);
        }

        if (context.url.pathname !== '/' && context.url.pathname.endsWith('/') || context.url.pathname.includes('//')) {
            context.url.pathname = context.url.pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
            await context.tool.redirect(context.url.href);
            return self.ender(context);
        }

        if (context.options.vhost) {
            const vhosts = [].concat(context.options.vhost);
            const hostname = request.headers.host;

            if (!vhosts.includes(hostname)) {
                context.code = 404;
                return self.ender(context);
            }

        }

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
                // Object.assign(self.information, self.listener.address());
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
