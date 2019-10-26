'use strict';

const Util = require('util');
const Crypto = require('crypto');
const QueryString = require('querystring');
const RandomBytes = Util.promisify(Crypto.randomBytes);

module.exports = class Session {

    constructor (options = {}) {

        if (options.storage && typeof options.storage !== 'object') {
            throw new Error('storage invalid type');
        }

        this.scheme = 'session';
        this.secret = options.secret || null;
        this.format = options.format || 'hex';
        this.seperator = options.seperator || '.';
        this.algorithm = options.algorithm || 'sha256';
        this.storage = options.storage || new Map();
    }

    async sid () {
        const bytes = await RandomBytes(16);
        const sid = bytes.toString('hex');
        return sid;
    }

    async sign (data, secret) {
        secret = secret || this.secret;

        if (!secret) throw new Error('secret required');
        if (typeof data !== 'string') throw new Error('data string required');

        const hex = Buffer.from(data, 'utf8').toString('hex');
        const hmac = Crypto.createHmac(this.algorithm, secret).update(data);

        return hex + this.seperator + hmac.digest(this.format);
    }

    async unsign (data, secret) {
        secret = secret || this.secret;

        if (!secret) throw new Error('secret required');
        if (typeof data !== 'string') throw new Error('data string required');

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
        if (!sid) throw new Error('sid required');
        return this.storage.has(sid);
    }

    async get (sid) {
        if (!sid) throw new Error('sid required');
        return this.storage.get(sid);
    }

    async delete (sid) {
        if (!sid) throw new Error('sid required');
        return this.storage.delete(sid);
    }

    async set (sid, data) {
        if (!sid) throw new Error('sid required');
        return this.storage.set(sid, data);
    }

    async create (context, data, secret) {
        secret = secret || this.secret;

        if (!data) throw new Error('data required');
        if (!secret) throw new Error('secret required');
        if (typeof data === 'object') data.sid = sid;

        const sid = await this.sid();
        const cookie = await this.sign(sid, { secret });
        const result = await this.set(sid, data);

        context.cookie.set('sid', cookie);

        return result;
    }

    async handle (context) {
        return {
            sid: this.sid,
            get: this.get,
            set: this.set,
            sign: this.sign,
            unsign: this.unsign,
            delete: this.delete,
            create: this.create.bind(context)
        };
    }

    async strategy (context) {
        const header = context.headers['cookie'] || '';
        const cookies = header.split(/\s*;\s*/);

        let encoded;
        for (const cookie of cookies) {
            const [ name, value ] = cookie.split(/\s*=\s*/);
            if (name === 'sid') {
                encoded = QueryString.unescape(value);
            }
        }

        if (!encoded) {
            return { valid: false };
        }

        const decoded = await this.unsign(encoded);

        if (!decoded) {
            return { valid: false };
        }

        return { valid: true, credential: { sid: decoded } };
    }

}
