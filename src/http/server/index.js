'use strict';

const Os = require('os');
const Util = require('util');
const Http = require('http');
const Https = require('https');
const Http2 = require('http2');
const Url = require('url').URL;
const Stream = require('stream');

const Mime = require('../../mime.js');
const Status = require('../../status.js');
const Methods = require('../../methods.js');

const Context = require('./context.js');

const Auth = require('./plugin/auth.js');
const Basic = require('./plugin/basic.js');
const Cache = require('./plugin/cache.js');
const Compress = require('./plugin/compress.js');
const Cookie = require('./plugin/cookie.js');
const Normalize = require('./plugin/normalize.js');
const Payload = require('./plugin/payload.js');
const Preflight = require('./plugin/preflight.js');
const Router = require('./plugin/router.js');
const Session = require('./plugin/session.js');
const File = require('./plugin/file.js');

/**
* Class for an Http Server.
*/

class HttpServer {

    get mime () { return Mime; }
    get status () { return Status; }
    get methods () { return Methods; }
    get context () { return Context; }

    /**
    * Create an Http Server.
    * @param {Object} options Options
    * @param {Number} [options.port=0] - Port number
    * @param {Boolean} [options.debug=false] - Debug mode
    * @param {Boolean} [options.host=Os.hostname||'localhost'] - Host name
    */

    constructor (options = {}) {

        this.family = null;
        this.address = null;

        this.type = options.type;
        this.port = options.port || 0;
        this.encoding = options.encoding;
        this.server = options.server || {};
        this.debug = options.debug || false;
        this.version = options.version || 1;
        this.handles = options.handles || [];
        this.secure = options.secure || false;
        this.host = options.host || Os.hostname() || 'localhost';
        this.end = typeof options.end === 'boolean' ? options.end : true;

        this.xss = options.xss || '1; mode=block';
        this.xframe = options.xframe || 'SAMEORIGIN';
        this.xcontent = options.xcontent || 'nosniff';
        this.xdownload = options.xdownload || 'noopen';
        this.hsts = options.hsts || 'max-age=31536000; includeSubDomains; preload';

        if (this.version === 2) this.server.allowHTTP1 = true;
        if (typeof this.secure === 'object') Object.assign(this.server, this.secure);

        if (this.version === 1 && !this.secure) this.listener = Http.createServer(this.server, this.handle.bind(this));
        else if (this.version === 1 && this.secure) this.listener = Https.createServer(this.server, this.handle.bind(this));
        else if (this.version === 2 && !this.secure) this.listener = Http2.createServer(this.server, this.handle.bind(this));
        else if (this.version === 2 && this.secure) this.listener = Http2.createSecureServer(this.server, this.handle.bind(this));

    }

    /**
    * Handle
    * @async
    * @private
    */

    async handle (request, response) {

        if (this.xss) response.setHeader('x-xss-protection', this.xss);
        if (this.xframe) response.setHeader('x-frame-options', this.xframe);
        if (this.hsts) response.setHeader('strict-transport-security', this.hsts);
        if (this.xdownload) response.setHeader('x-download-options', this.xdownload);
        if (this.xcontent) response.setHeader('x-content-type-options', this.xcontent);

        const instance = this;
        const context = new this.context({ request, response, instance });

        try {
            const handles = this.handles;

            for (const handle of handles) {
                if (response.closed || response.aborted || response.destroyed || response.writableEnded) {
                    break;
                } else  {
                    const match = context.match(handle.host, handle.method, handle.path);
                    if (!match) continue;
                    const value = await handle.handle.call(handle.self, context);
                    if (handle.name && value) context.set(handle.name, value);
                }
            }

            if (!response.closed && !response.aborted && !response.destroyed && !response.writableEnded && this.end) {
                return context.end();
            }

        } catch (error) {
            console.error(error);
            const message = this.debug ? error.message : 'internal server error';
            return context.code(500).message(message).end();
        }

    }

    /**
    * Adds handles to the server.
    * @async
    * @params
    */

    async add () {

        if (arguments.length === 1 && arguments[0] instanceof Array) {
            const [ items ] = arguments;
            let holder = [];

            for (const item of items) {
                if (item instanceof Array) {
                    this.add.apply(this, items);
                } else if (typeof item === 'function') {
                    holder.push(item);
                    this.add.apply(this, holder);
                    holder.length = 0;
                } else if (typeof item === 'string') {
                    holder.push(item);
                }
            }

            return;
        }

        const methods = this.methods;
        let self, handle, name;
        let method = ['*'], host = ['*'], path = ['/{*}'];

        for (const argument of arguments) {

            if (typeof argument === 'string') {
                const parts = argument.replace(/\s+/g, ' ').trim().toLowerCase().split(' ');

                for (const part of parts) {

                    if (part.startsWith('/')) {
                        path = part.split(',');
                    } else if (methods.includes(part)) {
                        method = part.split(',');
                    } else {
                        host = part.split(',');
                    }

                }

            // } else if (argument instanceof Array) {
                // console.warn('need to handle array');
            } else if (typeof argument === 'object') {
                self = argument;
                handle = self.handle;
                name = self.name || self.constructor.name;
            } else if (typeof argument === 'function') {
                self = argument;
                handle = argument;
                name = handle.name === 'Function' ? '' : handle.name;
            }

        }

        if (!handle) {
            throw new Error('handle function required');
        }

        if (name) {
            name = `${name.charAt(0).toLowerCase()}${name.slice(1)}`;
        }

        this.handles.push({ method, host, path, handle, name, self });
    }

    async get () {
        return this.add.apply(this, [ 'get', ...arguments ]);
    }

    async post () {
        return this.add.apply(this, [ 'post', ...arguments ]);
    }

    async put () {
        return this.add.apply(this, [ 'put', ...arguments ]);
    }

    async connect () {
        return this.add.apply(this, [ 'connect', ...arguments ]);
    }

    async delete () {
        return this.add.apply(this, [ 'delete', ...arguments ]);
    }

    async head () {
        return this.add.apply(this, [ 'head', ...arguments ]);
    }

    async options () {
        return this.add.apply(this, [ 'options', ...arguments ]);
    }

    async patch () {
        return this.add.apply(this, [ 'patch', ...arguments ]);
    }

    async trace () {
        return this.add.apply(this, [ 'trace', ...arguments ]);
    }

    /**
    * Starts listening on the port and host.
    * @async
    */

    async open () {
        return new Promise(resolve => {
            this.listener.listen(this.port, this.host, () => {
                const info = this.listener.address();
                this.port = info.port;
                this.family = info.family;
                this.address = info.address;
                this.host = this.host || info.address;
                resolve();
            });
        });
    }

    /**
    * Stops listening on the port and host.
    * @async
    */

    async close () {
        return new Promise(resolve => {
            this.listener.close(() => {
                resolve();
            });
        });
    }

}

Object.assign(HttpServer, {
    Server: HttpServer,
    Context,
    Auth,
    Basic,
    Cache,
    Compress,
    Cookie,
    File,
    Normalize,
    Payload,
    Preflight,
    Router,
    Session
});

module.exports = HttpServer;
