'use strict';

const QueryString = require('querystring');

throw new Error('not ready');

module.exports = class Cookie {

    constructor (option) {
        option = option || {};

        this.path = option.path || '';
        this.domain = option.domain || '';
        this.name = option.name || 'cookie';
        this.sameSite = option.sameSite || 'Strict';
        this.httpOnly = option.httpOnly === false ? false : true;
        this.secure = option.secure === undefined ? false : option.secure === true ? true : false;

        // Number of seconds until the cookie expires.
        // A zero or negative number will expire the cookie immediately.
        // If both (Expires and Max-Age) are set, Max-Age will have precedence.
        this.maxAge = option.maxAge || '';

        // <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
        this.expires = option.expires || '';
    }

    async handler (context) {

        for (const name in context.cookies) {
            let cookie = `${name}=${value}`;

            if (this.secure) cookie += '; Secure';
            if (this.httpOnly) cookie += '; HttpOnly';
            if (this.path) cookie += `; Path=${this.path}`;
            if (this.domain) cookie += `; Domain=${this.domain}`;
            if (this.maxAge) cookie += `; Max-Age=${this.maxAge}`;
            if (this.expires) cookie += `; Expires=${this.expires}`;
            if (this.sameSite) cookie += `; SameSite=${this.sameSite}`;

            context.head['set-cookie'] = cookie;
        }

    }

    async entries () {
        const header = this.context.request.headers['cookie'] || this.context.request.headers['Cookie'] || '';
        const cookies = header.split(/\s*;\s*/);

        const result = {};

        for (const cookie of cookies) {
            const [ name, value ] = cookie.split(/\s*=\s*/);

            if (name in result === false) {
                result[name] = QueryString.unescape(value);
            }

        }

        return result;
    }

}
