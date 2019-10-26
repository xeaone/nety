'use strict';

const QueryString = require('querystring');

module.exports = class Cookie {

    constructor (options = {}) {

        this.path = options.path || '';
        this.domain = options.domain || '';
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

    async add (context, name, value) {
        let cookie = `${name}=${value}`;

        if (this.secure) cookie += '; Secure';
        if (this.httpOnly) cookie += '; HttpOnly';
        if (this.path) cookie += `; Path=${this.path}`;
        if (this.domain) cookie += `; Domain=${this.domain}`;
        if (this.maxAge) cookie += `; Max-Age=${this.maxAge}`;
        if (this.expires) cookie += `; Expires=${this.expires}`;
        if (this.sameSite) cookie += `; SameSite=${this.sameSite}`;

        const header = context.response.getHeader('set-cookie');

        if (header) {

            if (typeof header === 'string') {
                context.response.setHeader('set-cookie', [header]);
            }

            context.response.getHeader('set-cookie').push(cookie);
        } else {
            context.response.setHeader('set-cookie', cookie);
        }

    }

    async entries (context) {
        const header = context.request.headers['cookie'] || '';
        const cookies = header.split(/\s*;\s*/);
        const entries = {};

        for (const cookie of cookies) {
            const [ name, value ] = cookie.split(/\s*=\s*/);
            if (name in entries === false) {
                entries[name] = QueryString.unescape(value);
            }
        }

        return Object.freeze(entries);
    }

    async handle (context) {

        const entries = await this.entries(context);
        const add = this.add.bind(this, context);

        return { add, entries };
    }

}
