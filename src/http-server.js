'use strict';

const Os = require('os');
const Util = require('util');
const Http = require('http');
const Https = require('https');
const Http2 = require('http2');
const Url = require('url').URL;
const Stream = require('stream');

const Mime = require('./mime.js');
const Status = require('./status.js');
const HttpContext = require('./http-context.js');

module.exports = class HttpServer {

    constructor (options = {}) {

        this.mime = Mime;
        this.status = Status;

        this.family = null;
        this.address = null;
        this.port = options.port || 0;
        this.debug = options.debug || false;
        this.plugins = options.plugins || [];
        this.host = options.host || Os.hostname() || 'localhost';

        this.options = options.server || {};
        this.version = options.version || 1;
        this.secure = options.secure || false;
        this.charset = options.charset || 'charset=utf8';
        this.contentType = options.contentType || 'text/plain';

        if (typeof this.secure === 'object') Object.assign(this.options, this.secure);

        if (this.version === 1 && this.secure === false) this.listener = Http.createServer(this.options, this.handle.bind(this));
        else if (this.version === 1 && this.secure === true) this.listener = Https.createServer(this.options, this.handle.bind(this));
        else if (this.version === 2 && this.secure === false) this.listener = Http2.createServer(this.options, this.handle.bind(this));
        else if (this.version === 2 && this.secure === true) this.listener = Http2.createSecureServer(this.options, this.handle.bind(this));

    }

    async handle (request, response) {

        console.warn('todo: cookies');
        console.warn('todo: query / params');

        const instance = this;
        const head = this.head;
        const cookie = this.cookie;

        const context = new HttpContext({
            instance,
            head, cookie,
            request, response,
        });

        try {
            const plugins = this.plugins;

            for (const plugin of plugins) {
                if (response.closed || response.aborted || response.destroyed || response.writableEnded) {
                    break;
                } else {
                    await plugin.handle.call(plugin, context);
                    // console.warn('todo: camcelcase the plugin name');
                    // const name = plugin.name;
                    // const value = await plugin.handle.call(plugin, context);
                    // if (value !== undefined) {
                    //     const property = { enumerable: true, value };
                    //     Object.defineProperty(context, name, property);
                    // }
                }
            }

            if (!response.closed && !response.aborted && !response.destroyed && !response.writableEnded) {
                context.end();
            }

        } catch (error) {
            const message = this.debug ? error.message : 'internal server error';
            context.code(500).message(message).end();
            console.error(error);
        }

    }

    async plugin (plugin) {

        if (typeof plugin === 'function') {
            if (!plugin.name) throw new Error('plugin - plugin name required');
            plugin = { handle: plugin, name: plugin.name };
        }

        this.plugins.push(plugin);
    }

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

    async close () {
        return new Promise(resolve => {
            this.listener.close(() => {
                resolve();
            });
        });
    }

}
