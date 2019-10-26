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
const Context = require('./context.js');

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

        this.xss = options.xss || '1; mode=block';
        this.xframe = options.xframe || 'SAMEORIGIN';
        this.xcontent = options.xcontent || 'nosniff';
        this.xdownload = options.xdownload || 'noopen';
        this.hsts = options.hsts || 'max-age=31536000; includeSubDomains; preload';

    }

    async handle (request, response) {

        console.warn('todo: query / params');

        if (this.xss) response.setHeader('x-xss-protection', this.xss);
        if (this.xframe) response.setHeader('x-frame-options', this.xframe);
        if (this.hsts) response.setHeader('strict-transport-security', this.hsts);
        if (this.xdownload) response.setHeader('x-download-options', this.xdownload);
        if (this.xcontent) response.setHeader('x-content-type-options', this.xcontent);

        const instance = this;
        const context = new Context({ request, response, instance });

        try {
            const plugins = this.plugins;

            for (const plugin of plugins) {
                if (response.closed || response.aborted || response.destroyed || response.writableEnded) {
                    break;
                } else {
                    const value = await plugin.handle.call(plugin, context);
                    context.set(plugin.name, value);
                }
            }

            if (!response.closed && !response.aborted && !response.destroyed && !response.writableEnded) {
                return context.end();
            }

        } catch (error) {
            console.error(error);
            const message = this.debug ? error.message : 'internal server error';
            return context.code(500).message(message).end();
        }

    }

    async plugin (plugin) {

        if (typeof plugin === 'function') {
            plugin = { handle: plugin, name: plugin.name };
        } else {
            plugin.name = plugin.name || plugin.constructor.name;
        }

        if (!plugin.name) {
            throw new Error('plugin - plugin name required');
        }

        plugin.name = `${plugin.name.charAt(0).toLowerCase()}${plugin.name.slice(1)}`;
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
