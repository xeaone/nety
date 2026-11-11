import QueryString from 'node:querystring';
import type Context from '../context.js';

export interface CookieOptions {
    path?: string;
    domain?: string;
    sameSite?: string;
    secure?: boolean;
    httpOnly?: boolean;
    maxAge?: string;
    expires?: string;
}

export default class Cookie {
    path = '';
    domain = '';
    // Number of seconds until the cookie expires.
    maxAge = '';
    expires = '';
    secure = true;
    httpOnly = true;
    sameSite = 'Strict';

    constructor(options: CookieOptions = {}) {
        Object.assign(this, options);

        // A zero or negative number will expire the cookie immediately.
        // If both (Expires and Max-Age) are set, Max-Age will have precedence.
        // <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
    }

    add(context: Context, name: string, value: string): void {
        let cookie = `${name}=${value}`;

        if (this.secure) cookie += '; Secure';
        if (this.httpOnly) cookie += '; HttpOnly';
        if (this.path) cookie += `; Path=${this.path}`;
        if (this.domain) cookie += `; Domain=${this.domain}`;
        if (this.maxAge) cookie += `; Max-Age=${this.maxAge}`;
        if (this.expires) cookie += `; Expires=${this.expires}`;
        if (this.sameSite) cookie += `; SameSite=${this.sameSite}`;

        const current = context.response.getHeader('set-cookie');
        const headers = typeof current === 'string' ? [current] : Array.isArray(current) ? [...current] : [];
        headers.push(cookie);
        context.response.setHeader('set-cookie', headers);
    }

    entries(context: Context): Readonly<Record<string, string>> {
        const value = context.request.headers['cookie'];
        const header = (Array.isArray(value) ? value[0] : value) || '';
        const cookies = header.split(/\s*;\s*/);
        const entries: Record<string, string> = {};

        for (const cookie of cookies) {
            const [name, value] = cookie.split(/\s*=\s*/);
            if (name in entries === false) {
                entries[name] = QueryString.unescape(value || '');
            }
        }

        return Object.freeze(entries);
    }

    handle(context: Context) {
        const entries = this.entries.bind(this, context);
        const add = this.add.bind(this, context);
        return { add, entries };
    }
}
