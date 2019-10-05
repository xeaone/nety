'use strict';

const Os = require('os');
const Http2 = require('http2');
const Url = require('url').URL;
const Events = require('events');
const Stream = require('stream');
const Buffer = require('buffer').Buffer;
const Querystring = require('querystring');

const Tool = require('./tool.sj');
const Option = require('./option.sj');
const Utility = require('./utility.js');
const Mimes = require('./mimes.js');

module.exports = class Servey extends Events {

    constructor (options) {
        super();

        options = options || {};

        this.port = 0;
        this.tools = options.tools || [];
        // this.routes = [];
        // this.auth = null;
        // this.context = null;

        // header security
        this.xss = true;
        this.hsts = true;
        this.cors = false;
        this.xframe = true;
        this.xcontent = true;
        this.xdownload = true;

        this.www = options.www || false;
        this.cache = options.cache || true;
        this.debug = options.debug || false;
        this.mimes = options.mimes || Mimes;
        this.maxBytes = options.maxBytes || 1e6, // 1mb

        this.methods = options.methods || Http2.METHODS;
        this.messages = options.messages || Http2.STATUS_CODES;
        this.methodsString = options.methodsString || Http2.METHODS.join(',');
        this.hostname = options.hostname || Os.hostname() || 'localhost';

        this.charset = options.charset || 'charset=utf8';
        this.contentType = options.contentType || 'text/plain';

        this.afters = options.afters || [];
        this.befores = options.befores || [];
        this.middles = options.middles || [];
        this.listener = options.listener || null;

        Object.defineProperty(this, 'tool', { value: {}, enumerable: true });

        if (options.listener) {
            this.listener = options.listener;
        } else if (options.secure) {
            this.listener = Http2.createSecureServer(options.server);
        } else {
            this.listener = Http2.createServer(options.server);
        }

        this.listener.on('error', this.error.bind(this));
        this.listener.on('stream', this.stream.bind(this));

    }

    async error (error) {
        console.log(error);
    }

    async stream (stream, headers, flags) {

        stream.on('error', this.error.bind(this));

        for (const before of befores) {
            if (stream.closed || stream.aborted || stream.destroyed || stream.endAfterHeaders) break;
            await before.apply(this, arguments);
            if (stream.closed || stream.aborted || stream.destroyed || stream.endAfterHeaders) break;
        }

        if (stream.closed || stream.aborted || stream.destroyed || stream.endAfterHeaders) return;

        for (const middle of middles) {
            if (stream.closed || stream.aborted || stream.destroyed || stream.endAfterHeaders) break;
            await middle.apply(this, arguments);
            if (stream.closed || stream.aborted || stream.destroyed || stream.endAfterHeaders) break;
        }

        if (stream.closed || stream.aborted || stream.destroyed || stream.endAfterHeaders) return;

        for (const after of afters) {
            if (stream.closed || stream.aborted || stream.destroyed || stream.endAfterHeaders) break;
            await after.apply(this, arguments);
            if (stream.closed || stream.aborted || stream.destroyed || stream.endAfterHeaders) break;
        }

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

    async open () {
        const self = this;
        return new Promise(function (resolve) {
            self.listener.listen(self.port, self.hostname, function () {
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
