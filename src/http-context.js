'use strict';

const Path = require('path');
const Querystring = require('querystring');

const Extension = function (data = '') {
    return data.includes('.') ? Path.extname(data).slice(1) : 'txt';
};

const Cookies = function (data = '') {
    const cookies = data.split(/\s*;\s*/);
    const result = {};

    for (const cookie of cookies) {
        const [ name, value ] = cookie.split(/\s*=\s*/);
        if (name in result === false) {
            result[name] = QueryString.unescape(value);
        }
    }

    return Object.freeze(result);
};

const CookieOptions = function (options = {}) {
    const result = {};

    result.path = options.path || '';
    result.domain = options.domain || '';
    result.name = options.name || 'cookie';
    // result.cookies = options.cookies || {};
    result.sameSite = options.sameSite || 'Strict';
    result.httpOnly = options.httpOnly === false ? false : true;
    result.secure = options.secure === undefined ? false : options.secure === true ? true : false;

    // Number of seconds until the cookie expires.
    // A zero or negative number will expire the cookie immediately.
    // If both (Expires and Max-Age) are set, Max-Age will have precedence.
    result.maxAge = options.maxAge || '';

    // <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
    result.expires = options.expires || '';

    return Object.freeze(result);
};

const HeadOptions = function (options = {}) {
    const result = {};

    result.xss = true;
    result.hsts = true;
    result.xframe = true;
    result.xcontent = true;
    result.xdownload = true;

    return Object.freeze(result);
};

module.exports = class HttpContext {

    constructor (options = {}) {

        this.raw = {
            head: {},
            code: 200,
            cookie: {},
            body: null,
            message: null,
        };

        this.request = options.request;
        this.response = options.response;
        this.instance = options.instance;

        this.path = this.request.headers[':path'] || this.request.url;
        this.scheme = this.request.headers[':scheme'] || this.secure ? 'https' : 'http';
        this.method = this.request.headers[':method'] || this.request.method.toLowerCase();
        this.authority = this.request.headers[':authority'] || this.request.headers['host'];
        this.url = new Url(`${scheme}://${authority}${path}`);

        this.headers = { ...this.request.headers };
        this.cookies = Cookies(this.request.headers['cookie']);

        this.HeadOptions = HeadOptions(options.head);
        this.CookieOptions = CookieOptions(options.cookie);

        if (this.HeadOptions.hsts === true) {
            this.raw.head['strict-transport-security'] = 'max-age=31536000; includeSubDomains; preload';
        } else if (typeof this.HeadOptions.hsts === 'string') {
            this.raw.head['strict-transport-security'] = this.HeadOptions.hsts;
        }

        if (this.HeadOptions.xframe === true) {
           this.raw.head['x-frame-options'] = 'SAMEORIGIN';
        } else if (typeof this.HeadOptions.xframe === 'string') {
            this.raw.head['x-frame-options'] = this.HeadOptions.xframe;
        }

        if (this.HeadOptions.xss === true) {
            this.raw.head['x-xss-protection'] = '1; mode=block';
        } else if (typeof this.HeadOptions.xss === 'string') {
            this.raw.head['x-xss-protection'] = this.HeadOptions.xss;
        }

        if (this.HeadOptions.xdownload === true) {
            this.raw.head['x-download-options'] = 'noopen';
        } else if (typeof this.HeadOptions.xdownload === 'string') {
            this.raw.head['x-download-options'] = this.HeadOptions.xdownload;
        }

        if (this.HeadOptions.xcontent === true) {
            this.raw.head['x-content-type-options'] = 'nosniff';
        } else if (typeof this.HeadOptions.xcontent === 'string') {
            this.raw.head['x-content-type-options'] = this.HeadOptions.xcontent;
        }

    }

    cookie (name, value) {
        this.raw.cookie[name] = value;
        return this;
    }

    head (name, value) {
        if (name in this.raw.head) {
            this.raw.head[name] = [ this.raw.head, value ];
        } else {
            this.raw.head[name] = value;
        }
        return this;
    }

    message (message) {
        this.raw.message = message;
        return this;
    }

    code (code) {
        this.raw.code = code;
        return this;
    }

    body (body) {
        this.raw.body = body;
        return this;
    }

    end () {

        if (this.raw.head === null || this.raw.head === undefined) this.raw.head = {};
        if (this.raw.code === null || this.raw.code === undefined) this.raw.code = 200;
        if (this.raw.cookie === null || this.raw.cookie === undefined) this.raw.cookie = {};
        if (this.raw.message === null || this.raw.message !== undefined) this.raw.message = this.status[ this.raw.code ];
        if (this.raw.body === null || this.raw.body === undefined) this.raw.body = { code: this.raw.code, message: this.raw.message };

        for (const name in this.raw.cookie) {
            const value = typeof this.raw.cookie[name] === 'string' ? this.raw.cookie[name] : this.raw.cookie[name].value;

            let cookie = `${name}=${value}`;

            if (this.CookieOptions.secure) cookie += '; Secure';
            if (this.CookieOptions.httpOnly) cookie += '; HttpOnly';
            if (this.CookieOptions.path) cookie += `; Path=${this.CookieOptions.path}`;
            if (this.CookieOptions.domain) cookie += `; Domain=${this.CookieOptions.domain}`;
            if (this.CookieOptions.maxAge) cookie += `; Max-Age=${this.CookieOptions.maxAge}`;
            if (this.CookieOptions.expires) cookie += `; Expires=${this.CookieOptions.expires}`;
            if (this.CookieOptions.sameSite) cookie += `; SameSite=${this.CookieOptions.sameSite}`;

            this.raw.head['set-cookie'].push(cookie);
        }

        if (this.raw.body instanceof Stream.Readable) {
            const extension = Extension(this.raw.body.path);
            const mime = this.instance.mime[extension];

            this.raw.head['content-type'] = `${mime};${this.charset}`;
            this.response.writeHead(this.raw.code, this.raw.head);
            this.raw.body.pipe(this.response);

            return;
        }

        if (typeof this.raw.body === 'object') {
            const mime = this.instance.mime['json'];
            this.raw.head['content-type'] = `${mime};${this.charset}`;
            this.raw.body = JSON.stringify(this.raw.body);
        }

        if (!this.raw.head['content-type']) this.raw.head['content-type'] = `${this.contentType};${this.charset}`;
        if (!this.raw.head['content-length']) this.raw.head['content-length'] = Buffer.byteLength(this.raw.body);

        this.response.writeHead(this.raw.code, this.raw.head);
        this.response.end(this.raw.body);
    }

}
