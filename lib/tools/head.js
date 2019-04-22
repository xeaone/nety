'use strict';

module.exports = class Head {

    constructor (options) {
        options = options || {};
        options.cookie = options.cookie || {};

        this._cookie = options.cookie;

        this._cookie.path = options.cookie.path || '';
        this._cookie.domain = options.cookie.domain || '';
        this._cookie.name = options.cookie.name || 'cookie';
        this._cookie.sameSite = options.cookie.sameSite || 'Strict';
        this._cookie.httpOnly = options.cookie.httpOnly === false ? false : true;
        this._cookie.secure = options.cookie.secure === undefined ? false : options.cookie.secure === true ? true : false;

        // Number of seconds until the cookie expires.
        // A zero or negative number will expire the cookie immediately.
        // If both (Expires and Max-Age) are set, Max-Age will have precedence.
        this._cookie.maxAge = options.cookie.maxAge || '';

        // <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
        this._cookie.expires = options.cookie.expires || '';

    }

    async cookie (context, data, name) {
        if (this._cookie.secure) data = `${data}; Secure`;
        if (this._cookie.httpOnly) data = `${data}; HttpOnly`;
        if (this._cookie.path) data = `${data}; Path=${this._cookie.path}`;
        if (this._cookie.domain) data = `${data}; Domain=${this._cookie.domain}`;
        if (this._cookie.maxAge) data = `${data}; Max-Age=${this._cookie.maxAge}`;
        if (this._cookie.expires) data = `${data}; Expires=${this._cookie.expires}`;
        if (this._cookie.sameSite) data = `${data}; SameSite=${this._cookie.sameSite}`;
        return context.head['set-cookie'] = `${name || this._cookie.name}=${data}`;
    }

    async cache (context, header) {
        const self = this;

        if (typeof self.instance.cache === 'string') {
            header['cache-control'] = self.instance.cache;
        } else if (typeof self.instance.cache === 'number') {
            header['cache-control'] = `max-age=${self.instance.cache}`;
        } else if (typeof self.instance.cache === 'boolean') {
            header['cache-control'] = self.instance.cache ? 'max-age=3600' : 'no-cache';
        }

        return header;
    }

    async security (context, header) {
        const self = this;

        if (self.instance.cors) {
            if (self.instance.cors.constructor === Object) {
                header['access-control-max-age'] = self.instance.cors.age || 31536000;
                header['access-control-allow-origin'] = self.instance.cors.origin || self.instance.hostname;
                header['access-control-allow-credentials'] = self.instance.cors.credentials || 'true';
                header['access-control-expose-headers'] = self.instance.cors.expose || 'WWW-Authenticate, Server-Authorization';
                header['access-control-allow-headers'] = self.instance.cors.headers || 'Content-Type, Authorization, X-Frame-Options';
                header['access-control-allow-methods'] = self.instance.cors.methods || 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD';
            } else if (self.instance.cors === true) {
                header['access-control-max-age'] = 31536000;
                header['access-control-allow-origin'] = '*';
                header['access-control-allow-methods'] = '*';
                header['access-control-allow-credentials'] = 'true';
                header['access-control-expose-headers'] = 'WWW-Authenticate, Server-Authorization';
                header['access-control-allow-headers'] = 'Content-Type, Authorization, X-Frame-Options';
            }
        }

        if (self.instance.hsts) {
            if (self.instance.hsts === true) {
                header['strict-transport-security'] = 'max-age=15768000';
            } else if (typeof self.instance.hsts === 'number') {
                header['strict-transport-security'] = `max-age=${self.instance.hsts}`;
            } else {

                header['strict-transport-security'] = `max-age=${self.instance.hsts.maxAge || 15768000}`;

                if (self.instance.hsts.includeSubdomains || self.instance.hsts.includeSubDomains) {
                    header['strict-transport-security'] = header['strict-transport-security'] + '; includeSubDomains';
                }

                if (self.instance.hsts.preload) {
                    header['strict-transport-security'] = header['strict-transport-security'] + '; preload';
                }

            }
        }

        if (self.instance.xframe) {
            if (self.instance.xframe === true) {
                header['x-frame-options'] = 'SAMEORIGIN';
            } else if (self.instance.xframe === false) {
                header['x-frame-options'] = 'DENY';
            } else if (typeof self.instance.xframe === 'string') {
                header['x-frame-options'] = self.instance.xframe.toUpperCase();
            } else if (typeof self.instance.xframe.rule === 'string' && self.instance.xframe.rule.toLowerCase() === 'allow-from') {
                if (!self.instance.xframe.source) {
                    header['x-frame-options'] = 'SAMEORIGIN';
                } else {
                    header['x-frame-options'] = 'ALLOW-FROM ' + self.instance.xframe.source;
                }
            } else {
                header['x-frame-options'] = 'DENY';
            }
        }

        if (self.instance.xss) {
            if (self.instance.xss === true) {
                header['x-xss-protection'] = '1; mode=block';
            }
        }

        if (self.instance.xdownload) {
            if (self.instance.xdownload === true) {
                header['x-download-options'] = 'noopen';
            }
        }

        if (self.instance.xcontent) {
            if (self.instance.xcontent === true) {
                header['x-content-type-options'] = 'nosniff';
            }
        }

        // if (self.instance.referrer) {
        // 	header['referrer-policy'] = self.instance.referrer;
        // }

        return header;
    }

};
