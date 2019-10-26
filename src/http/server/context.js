'use strict';


const Path = require('path');
const Url = require('url').URL;
const Stream = require('stream');
const Querystring = require('querystring');

const Mime = require('../../mime.js');
const Status = require('../../status.js');

const HeadOptions = function (options = {}) {
    const result = {};

    result.xss = true;
    result.hsts = true;
    result.xframe = true;
    result.xcontent = true;
    result.xdownload = true;

    return Object.freeze(result);
};

module.exports = class Context {

    constructor (options = {}) {
        this.mime = Mime;
        this.status = Status;
        this.request = options.request;
        this.response = options.response;
        this.instance = options.instance;
        this.content = options.content || ''
        this.charset = options.charset || 'charset=utf8';
        this.headers = Object.freeze({ ...this.request.headers });
        this.path = this.request.headers[':path'] || this.request.url;
        this.scheme = this.request.headers[':scheme'] || this.secure ? 'https' : 'http';
        this.method = this.request.headers[':method'] || this.request.method.toLowerCase();
        this.authority = this.request.headers[':authority'] || this.request.headers['host'];
        this.url = new Url(`${this.scheme}://${this.authority}${this.path}`);
    }

    set (name, value) {
        if (name in this) throw new Error('Context - property defined');
        const enumerable = true;
        const property = { enumerable, value };
        Object.defineProperty(this, name, property);
    }

    type (type) {
        if (type) {
            const mime = this.mime[type] || this.mime['default'];
            this.response.setHeader('content-type', `${mime};${this.charset}`);
            return this;
        } else {
            this.response.getHeader('content-type');
        }
    }

    head (name, value) {
        if (value) {
            this.response.setHeader(name, value);
            return this;
        } else {
            this.response.getHeader(name);
        }
    }

    message (message) {
        if (message) {
            this.response.statusMessage = message;
            return this;
        } else {
            return this.response.statusMessage;
        }
    }

    code (code) {
        if (code) {
            this.response.statusCode = code;
            return this;
        } else {
            return this.response.statusCode;
        }
    }

    body (body) {
        if (body) {
            this._body = body;
            return this;
        } else {
            return this._body;
        }
    }

    end (body) {

        const code = this.response.statusCode || 200;
        const message = this.response.statusMessage || this.status[code] || '';

        this._body = body || this._body;
        body = body || this._body || { code, message };

        if (!this.response.hasHeader('content-type')) {
            const path = body.path || this.url.pathname;
            const extension = Path.extname(path).slice(1);
            const mime = this.mime[extension || 'default'];
            this.response.setHeader('content-type', `${mime};${this.charset}`);
        }

        if (body instanceof Stream.Readable) {
            // this.response.setHeader('transfer-encoding', 'chunked');
            return new Promise((resolve, reject) => body.pipe(this.response).on('end', resolve).on('error', reject));
        } else if (body instanceof Buffer) {
            this.response.setHeader('content-length', body.length);
            this.response.write(body);
        } else if (typeof body === 'object') {
            body = JSON.stringify(body);
            this.response.setHeader('content-type', `${this.mime['json']};${this.charset}`);
            this.response.setHeader('content-length', Buffer.byteLength(body));
            this.response.write(body);
        } else if (typeof body === 'string') {
            this.response.setHeader('content-length', Buffer.byteLength(body));
            this.response.write(body);
        }

        return new Promise((resolve) => this.response.end(() => resolve()));
    }

}
