'use strict';

module.exports = class Head {

    constructor (options) {
        options = options || {};

        this.cookiePath = options.cookie.path || '';
        this.cookieDomain = options.cookie.domain || '';
        this.cookieName = options.cookie.name || 'cookie';
        this.cookieSameSite = options.cookie.sameSite || 'Strict';
        this.cookieHttpOnly = options.cookie.httpOnly === false ? false : true;
        this.cookieSecure = options.cookie.secure === undefined ? false : options.cookie.secure === true ? true : false;

        // Number of seconds until the cookie expires.
        // A zero or negative number will expire the cookie immediately.
        // If both (Expires and Max-Age) are set, Max-Age will have precedence.
        this.cookieMaxAge = options.cookie.maxAge || '';

        // <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
        this.cookieExpires = options.cookie.expires || '';

    }

    async cookie (value, name) {
        name = name || this.cookieName;

        if (!value) {
            throw new Error('Servey.tool.head.cookie - value argument required');
        }

        if (!name) {
            throw new Error('Servey.tool.head.cookie - name argument required');
        }

        let cookie = `${name}=${value}`;

        if (this.cookieSecure) cookie += 'Secure;';
        if (this.cookieHttpOnly) cookie += 'HttpOnly;';
        if (this.cookiePath) cookie += `Path=${this.cookiePath};`;
        if (this.cookieDomain) cookie += `Domain=${this.cookieDomain};`;
        if (this.cookieMaxAge) cookie += `Max-Age=${this.cookieMaxAge};`;
        if (this.cookieExpires) cookie += `Expires=${this.cookieExpires}`;
        if (this.cookieSameSite) cookie += `SameSite=${this.cookieSameSite}`;

        this.context.head['set-cookie'] = cookie;

        return this.context;
    }

    async cache () {

        if (typeof this.instance.cache === 'string') {
            this.context.head['cache-control'] = this.instance.cache;
        } else if (typeof this.instance.cache === 'number') {
            this.context.head['cache-control'] = `max-age=${this.instance.cache}`;
        } else if (typeof this.instance.cache === 'boolean') {
            this.context.head['cache-control'] = this.instance.cache ? 'max-age=3600' : 'no-cache';
        }

        return this.context;
    }

    async security () {

        if (this.instance.cors) {
            if (this.instance.cors.constructor === Object) {
                this.context.head['access-control-max-age'] = this.instance.cors.age || 31536000;
                this.context.head['access-control-allow-origin'] = this.instance.cors.origin || this.instance.hostname;
                this.context.head['access-control-allow-credentials'] = this.instance.cors.credentials || 'true';
                this.context.head['access-control-expose-headers'] = this.instance.cors.expose || 'WWW-Authenticate, Server-Authorization';
                this.context.head['access-control-allow-headers'] = this.instance.cors.headers || 'Content-Type, Authorization, X-Frame-Options';
                this.context.head['access-control-allow-methods'] = this.instance.cors.methods || 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD';
            } else if (this.instance.cors === true) {
                this.context.head['access-control-max-age'] = 31536000;
                this.context.head['access-control-allow-origin'] = '*';
                this.context.head['access-control-allow-methods'] = '*';
                this.context.head['access-control-allow-credentials'] = 'true';
                this.context.head['access-control-expose-headers'] = 'WWW-Authenticate, Server-Authorization';
                this.context.head['access-control-allow-headers'] = 'Content-Type, Authorization, X-Frame-Options';
            }
        }

        if (this.instance.hsts) {
            if (this.instance.hsts === true) {
                this.context.head['strict-transport-security'] = 'max-age=15768000';
            } else if (typeof this.instance.hsts === 'number') {
                this.context.head['strict-transport-security'] = `max-age=${this.instance.hsts}`;
            } else {

                this.context.head['strict-transport-security'] = `max-age=${this.instance.hsts.maxAge || 15768000}`;

                if (this.instance.hsts.includeSubdomains || this.instance.hsts.includeSubDomains) {
                    this.context.head['strict-transport-security'] = this.context.head['strict-transport-security'] + '; includeSubDomains';
                }

                if (this.instance.hsts.preload) {
                    this.context.head['strict-transport-security'] = this.context.head['strict-transport-security'] + '; preload';
                }

            }
        }

        if (this.instance.xframe) {
            if (this.instance.xframe === true) {
                this.context.head['x-frame-options'] = 'SAMEORIGIN';
            } else if (this.instance.xframe === false) {
                this.context.head['x-frame-options'] = 'DENY';
            } else if (typeof this.instance.xframe === 'string') {
                this.context.head['x-frame-options'] = this.instance.xframe.toUpperCase();
            } else if (typeof this.instance.xframe.rule === 'string' && this.instance.xframe.rule.toLowerCase() === 'allow-from') {
                if (!this.instance.xframe.source) {
                    this.context.head['x-frame-options'] = 'SAMEORIGIN';
                } else {
                    this.context.head['x-frame-options'] = 'ALLOW-FROM ' + this.instance.xframe.source;
                }
            } else {
                this.context.head['x-frame-options'] = 'DENY';
            }
        }

        if (this.instance.xss) {
            if (this.instance.xss === true) {
                this.context.head['x-xss-protection'] = '1; mode=block';
            }
        }

        if (this.instance.xdownload) {
            if (this.instance.xdownload === true) {
                this.context.head['x-download-options'] = 'noopen';
            }
        }

        if (this.instance.xcontent) {
            if (this.instance.xcontent === true) {
                this.context.head['x-content-type-options'] = 'nosniff';
            }
        }

        // if (this.instance.referrer) {
        // 	this.context.head['referrer-policy'] = this.instance.referrer;
        // }

        return this.context;
    }

};
