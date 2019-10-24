'use strict';

const QueryString = require('querystring');

module.exports = class Cookie {

    constructor (options = {}) {

        this.path = options.path || '';
        this.domain = options.domain || '';
        this.name = options.name || 'cookie';
        // this.cookies = options.cookies || {};
        this.sameSite = options.sameSite || 'Strict';
        this.httpOnly = options.httpOnly === false ? false : true;
        this.secure = options.secure === undefined ? false : options.secure === true ? true : false;

        // Number of seconds until the cookie expires.
        // A zero or negative number will expire the cookie immediately.
        // If both (Expires and Max-Age) are set, Max-Age will have precedence.
        this.maxAge = options.maxAge || '';

        // <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
        this.expires = options.expires || '';
    }

    async get (context, name, value) {
        console.warn('todo: need to implement cookie get');
    }

    async set (context, name, value) {
        let cookie = `${name}=${value}`;

        if (this.secure) cookie += '; Secure';
        if (this.httpOnly) cookie += '; HttpOnly';
        if (this.path) cookie += `; Path=${this.path}`;
        if (this.domain) cookie += `; Domain=${this.domain}`;
        if (this.maxAge) cookie += `; Max-Age=${this.maxAge}`;
        if (this.expires) cookie += `; Expires=${this.expires}`;
        if (this.sameSite) cookie += `; SameSite=${this.sameSite}`;

        context.head['set-cookie'].push(cookie);
    }

    async handle (context) {
        context.head['set-cookie'] = context.head['set-cookie'] || [];

        const set = this.set.bind(this, context);
        const get = this.get.bind(this, context);
        const cookies = this.cookies;

        for (const name in cookies) {
            const value = cookies[name];
            let cookie = `${name}=${cookies[name]}`;
            this.set(context, name, value);
        }

        return { set, get };
    }

}
