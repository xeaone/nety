'use strict';

const Path = require('path');
const Url = require('url').URL;
const Stream = require('stream');
// const Querystring = require('querystring');

const Mime = require('../../mime.js');
const Status = require('../../status.js');

module.exports = class Context {

    get mime () { return Mime; }
    get status () { return Status; }

    constructor (options = {}) {
        const request = options.request;
        const response = options.response;
        const instance = options.instance;

        this._body = null;
        this._secure = options.secure || instance.secure;
        this._host = options.host || instance.host || '';
        this._type = options.type || instance.type || 'default';
        this._encoding = options.encoding || instance.encoding || 'utf8';

        const headers = Object.freeze({ ...request.headers });
        const method = (request.headers[ ':method' ] || request.method).toLowerCase();
        const [ , prefix, path ] = (request.headers[ ':path' ] || request.url).match(/(^\/+)?(.*)/);
        const scheme = (request.headers[ ':scheme' ] || this._secure ? 'https' : 'http').toLowerCase();
        const authority = (request.headers[ ':authority' ] || request.headers[ 'host' ] || this._host).toLowerCase();

        const url = new Url(`${path}`, `${scheme}://${authority}${prefix || '/'}`);

        Object.defineProperties(this, {
            request: { enumerable: true, value: request },
            response: { enumerable: true, value: response },
            instance: { enumerable: true, value: instance },
            headers: { enumerable: true, value: headers },
            path: { enumerable: true, value: path },
            scheme: { enumerable: true, value: scheme },
            method: { enumerable: true, value: method },
            authority: { enumerable: true, value: authority },
            url: { enumerable: true, value: url },
        });

    }

    /**
    * Defines a property on the context.
    * @param {String} name - name of property
    * @param {Any} value - value of property
    */

    set (name, value) {
        if (name in this) return;
        const enumerable = true;
        const property = { enumerable, value };
        Object.defineProperty(this, name, property);
    }

    /**
    * Sets the content-type header using a file type.
    * @param {String} [type] - the file type.
    * @returns {Context|String} - Return the context instance for chaining if the type param is provided or the value of content-type header.
    */

    type (type) {
        if (type) {
            const mime = this.mime[ type ] || this.mime[ this._type ];
            this.response.setHeader('content-type', `${mime};charset=${this._encoding}`);
            return this;
        } else {
            this.response.getHeader('content-type');
        }
    }

    head (name, value) {
        if (value === undefined) {
            return this.response.getHeader(name);
        } else {
            if (value === '' || value === null) {
                this.response.removeHeader(name);
            } else {
                this.response.setHeader(name, value);
            }
            return this;
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
        const message = this.status[ code ] || '';
        body = body || this._body || message;

        if (!this.response.hasHeader('content-type')) {
            const path = this.url.pathname;
            const extension = Path.extname(path).slice(1);

            if (extension) {
                const mime = this.mime[ extension ] || this.mime[ this._type ];
                this.response.setHeader('content-type', `${mime};charset=${this._encoding}`);
            }

        }

        if (body instanceof Stream) {
            return new Promise((resolve, reject) => body.pipe(this.response).on('error', reject).on('end', resolve));
        } else {

            if (typeof body === 'string' || body instanceof Buffer) {

                if (!this.response.hasHeader('content-type')) {
                    this.response.setHeader('content-type', `${this.mime[ this._type ]};charset=${this._encoding}`);
                }

            } else if (typeof body === 'object') {
                body = JSON.stringify(body);

                if (!this.response.hasHeader('content-type')) {
                    this.response.setHeader('content-type', `${this.mime[ 'json' ]};charset=${this._encoding}`);
                }

            }

            this.response.setHeader('content-length', Buffer.byteLength(body));
            this.response.write(body);
        }

        return new Promise((resolve, reject) => this.response.on('error', reject).end(resolve));
    }

};
