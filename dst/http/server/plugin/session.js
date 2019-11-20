'use strict';

const Util = require('util');
const Crypto = require('crypto');
const QueryString = require('querystring');
const RandomBytes = Util.promisify(Crypto.randomBytes);

module.exports = class Session {

    constructor (options = {}) {

        this.scheme = 'session';
        this.secret = options.secret || null;
        this.format = options.format || 'hex';
        this.realm = options.realm || 'secure';
        this.validate = options.validate || null;
        this.seperator = options.seperator || '.';
        this.storage = options.storage || new Map();
        this.algorithm = options.algorithm || 'sha256';

        if (typeof this.realm !== 'string') throw new Error('Session - realm string required');
        if (typeof this.secret !== 'string') throw new Error('Session - secret string required');
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

    async has (sid) {
        if (!sid) throw new Error('Session - sid required');
        return this.storage.has(sid);
    }

    async get (sid) {
        if (!sid) throw new Error('Session - sid required');
        return this.storage.get(sid);
    }

    async delete (sid) {
        if (!sid) throw new Error('Session - sid required');
        return this.storage.delete(sid);
    }

    async set (sid, data) {
        if (!sid) throw new Error('Session - sid required');
        return this.storage.set(sid, data);
    }

    async create (context, data, secret) {
        secret = secret || this.secret;

        if (!data) throw new Error('Session - data required');
        if (!secret) throw new Error('Session - secret required');
        if (typeof data === 'object') data.sid = sid;

        const sid = await this.sid();
        const cookie = await this.sign(sid, { secret });
        const result = await this.set(sid, data);

        context.cookie.set('sid', cookie);

        return result;
    }

    async forbidden (context) {
        return context.code(403).end();
    }

    async unauthorized (context) {
        return context.code(401).head('www-authenticate', `${this.scheme} realm="${this.realm}"`).end();
    }

    async handle (context) {

        const plugin = {
            sid: this.sid,
            get: this.get,
            set: this.set,
            sign: this.sign,
            unsign: this.unsign,
            delete: this.delete,
            create: this.create.bind(context)
        };

        const ignores = this.ignores;
        const method = context.method;
        const path = context.url.pathname;

        const ignored = ignores.find(ignore => [path, method].includes(ignore));
        if (ignored) return plugin;

        const header = context.headers['cookie'] || '';
        const cookies = header.split(/\s*;\s*/);

        let encoded;
        for (const cookie of cookies) {
            const [ name, value ] = cookie.split(/\s*=\s*/);
            if (name === 'sid') {
                encoded = QueryString.unescape(value);
            }
        }

        if (!encoded) return this.unauthorized(context);

        const decoded = await this.unsign(encoded);

        if (!decoded) return this.unauthorized(context);

        const validate = await this.validate(context, decoded);

        if (!validate || typeof validate !== 'object') {
            throw new Error('Session - validate object required');
        }

        if (validate.forbidden) return this.forbidden(context);
        if (!validate.valid) return this.unauthorized(context);

        const credential = validate.credential;
        context.set('credential', credential);

        return plugin;
    }


}
