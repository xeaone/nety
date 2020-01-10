'use strict';

const Util = require('util');
const Crypto = require('crypto');
const QueryString = require('querystring');
const RandomBytes = Util.promisify(Crypto.randomBytes);

module.exports = class Session {

    constructor (options = {}) {

        this.scheme = 'session';
        this.ignores = options.ignores || [];
        this.secret = options.secret || null;
        this.name = options.name || 'session'; // cookie name
        this.format = options.format || 'hex';
        this.realm = options.realm || 'secure';
        this.validate = options.validate || null;
        this.seperator = options.seperator || '.';
        this.storage = options.storage || new Map();
        this.algorithm = options.algorithm || 'sha256';
        this.expiration = options.expiration || 1000*60*60*24; // 24 hours

        this.secure = typeof options.secure === 'boolean' ? options.secure : true;
        this.httpOnly = typeof options.httpOnly === 'boolean' ? options.httpOnly : true;
        this.sameSite = typeof options.sameSite === 'string' ? options.sameSite : 'strict';

        // if (typeof this.secret !== 'string') throw new Error('Session - secret string required');
        if (typeof this.realm !== 'string') throw new Error('Session - realm string required');
        if (typeof this.scheme !== 'string') throw new Error('Session - scheme string  required');
        if (typeof this.validate !== 'function') throw new Error('Session - validate function required');

    }

    async sid () {
        const bytes = await RandomBytes(16);
        const sid = bytes.toString('hex');
        return sid;
    }

    async sign (data, secret) {
        secret = secret || this.secret;

        if (!secret) throw new Error('Session - secret required');
        if (typeof data !== 'string') throw new Error('Session - data string required');

        const hex = Buffer.from(data, 'utf8').toString('hex');
        const hmac = Crypto.createHmac(this.algorithm, secret).update(data);

        return hex + this.seperator + hmac.digest(this.format);
    }

    async unsign (data, secret) {
        secret = secret || this.secret;

        if (!secret) throw new Error('Session - secret required');
        if (typeof data !== 'string') throw new Error('Session - data string required');

        const [ hex, hmac ] = data.split(this.seperator);
        const text = Buffer.from(hex, 'hex').toString('utf8');
        const computed = Crypto.createHmac(this.algorithm, secret).update(text).digest(this.format);

        const hmacBuffer = Buffer.from(hmac);
        const computedBuffer = Buffer.from(computed);

        if (computedBuffer.length !== hmacBuffer.length) return null;

        const valid = Crypto.timingSafeEqual(computedBuffer, hmacBuffer);
        return valid ? text : null;
    }

    async has () {
        return this.storage.has.apply(this.storage, arguments);
    }

    async get () {
        return this.storage.get.apply(this.storage, arguments);
    }

    async delete () {
        return this.storage.delete.apply(this.storage, arguments);
    }

    async set () {
        return this.storage.set.apply(this.storage, arguments);
    }

    async destroy (context) {
        let cookie = '';

        if (this.secure) cookie += ';Secure';
        if (this.httpOnly) cookie += ';HttpOnly';
        if (this.sameSite) cookie += `;SameSite=${this.sameSite}`;

        context.head('set-cookie', `${this.name}=${cookie};Max-Age=0`);
    }

    async create (context, secret) {
        secret = secret || this.secret;

        if (!secret) throw new Error('Session - secret required');

        const sid = await this.sid();
        const expiration = Date.now() + this.expiration;

        let cookie = await this.sign(`${sid}.${expiration}`, secret);

        if (this.secure) cookie += ';Secure';
        if (this.httpOnly) cookie += ';HttpOnly';
        if (this.sameSite) cookie += `;SameSite=${this.sameSite}`;
        if (this.maxAge) cookie += `;Max-Age=${this.maxAge}`;

        context.head('set-cookie', `${this.name}=${cookie}`);

        return sid;
    }

    async forbidden (context) {
        return context.code(403).end();
    }

    async unauthorized (context) {
        return context.code(401).head('www-authenticate', `${this.scheme} realm="${this.realm}"`).end();
    }

    async cookie (context) {
        const header = context.headers['cookie'] || '';
        const cookies = header.split(/\s*;\s*/);

        for (const cookie of cookies) {
            const [ name, value ] = cookie.split(/\s*=\s*/);
            if (name === this.name) {
                return QueryString.unescape(value);
            }
        }

        return null;
    }

    async handle (context) {

        context.set('session', {
            sid: this.sid.bind(this),
            get: this.get.bind(this),
            set: this.set.bind(this),
            sign: this.sign.bind(this),
            unsign: this.unsign.bind(this),
            delete: this.delete.bind(this),
            create: this.create.bind(this, context),
            destory: this.destory.bind(this, context)
        });

        const ignores = this.ignores;
        const method = context.method;
        const path = context.url.pathname;

        const ignored = ignores.find(ignore => [path, method].includes(ignore));
        if (ignored) return;

        const encoded = await this.cookie(context);
        if (!encoded) return this.unauthorized(context);

        const decoded = await this.unsign(encoded);
        if (!decoded) return this.unauthorized(context);

        const [ identifier, expiration ] = decoded.split('.');
        const now = Date.now();

        if (expiration <= now) return this.unauthorized(context);

        const validate = await this.validate(context, identifier);

        if (!validate || typeof validate !== 'object') {
            throw new Error('Session - validate object required');
        }

        if (validate.forbidden) return this.forbidden(context);
        if (!validate.valid) return this.unauthorized(context);

        context.set('credential', validate.credential);
    }

}
