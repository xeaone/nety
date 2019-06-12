'use strict';

const Util = require('util');
const Crypto = require('crypto');
const QueryString = require('querystring');
const RandomBytes = Util.promisify(Crypto.randomBytes);

module.exports = class Session {

    constructor (option) {
        option = option || {};

        if (option.storage && typeof option.storage !== 'object') {
            throw new Error('Servey.tool.session - storage option invalid type');
        }

        this.secret = option.secret || null;
        this.format = option.format || 'hex';
        this.realm = option.realm || 'secure';
        this.scheme = option.scheme || 'cookie';
        this.seperator = option.seperator || '.';
        this.algorithm = option.algorithm || 'sha256';
        this.storage = option.storage || new Map();
    }

    async strategy (context, option) {
        const header = context.request.headers['cookie'] || context.request.headers['cookie'] || '';
        const cookies = header.split(/\s*;\s*/);

        let encoded;
        for (const cookie of cookies) {
            const [ name, value ] = cookie.split(/\s*=\s*/);
            if (name === this.scheme) {
                encoded = QueryString.unescape(value);
            }
        }

        if (!encoded) {
            return { valid: false, message: 'auth session invalid encoded cookie' };
        }

        const decoded = await this.unsign(encoded, option);

        if (!decoded) {
            return { valid: false, message: 'auth session invalid decoded cookie' };
        }

        return { valid: true, credential: { decoded, encoded } };
    }

    // async verify (data, option) {
    // 	if (typeof data !== 'string') throw new Error('auth session data string required');
    //
    // 	option = option || {};
    //
    // 	const secret = option.secret || this.secret;
    //
    // 	if (!secret) throw new Error('auth session secret required');
    //
    // 	const parts = data.split(this.seperator);
    // 	const hmac = parts[1];
    // 	const text = Buffer.from(parts[0], 'hex').toString('utf8');
    // 	const computed = Crypto.createHmac(this.algorithm, secret).update(text).digest(this.format);
    //
    // 	const hmacBuffer = Buffer.from(hmac);
    // 	const computedBuffer = Buffer.from(computed);
    //
    // 	if (computedBuffer.length !== hmacBuffer.length) return null;
    //
    // 	return Crypto.timingSafeEqual(computedBuffer, hmacBuffer);
    // }

    async sid () {
        const bytes = await RandomBytes(16);
        const sid = bytes.toString('hex');
        return sid;
    }

    async sign (data, option) {

        if (typeof data !== 'string') {
            throw new Error('session data string required');
        }

        option = option || {};

        const secret = option.secret || this.secret;

        if (!secret) {
            throw new Error('auth session secret required');
        }

        const hex = Buffer.from(data, 'utf8').toString('hex');
        const hmac = Crypto.createHmac(this.algorithm, secret).update(data);

        return hex + this.seperator + hmac.digest(this.format);
    }

    async unsign (data, option) {

        if (typeof data !== 'string') {
            throw new Error('session data string required');
        }

        option = option || {};
        const secret = option.secret || this.secret;

        if (!secret) {
            throw new Error('session secret required');
        }

        const [ hex, hmac ] = data.split(this.seperator);
        const text = Buffer.from(hex, 'hex').toString('utf8');

        const computed = Crypto.createHmac(this.algorithm, secret).update(text).digest(this.format);

        const hmacBuffer = Buffer.from(hmac);
        const computedBuffer = Buffer.from(computed);

        if (computedBuffer.length !== hmacBuffer.length) return null;

        const valid = Crypto.timingSafeEqual(computedBuffer, hmacBuffer);

        return valid ? text : null;
    }

    async get (sid) {
        let result;

        if (!sid) {
            throw new Error('session sid required');
        }

        if (this.storage.get.constructor.name === 'AsyncFunction') {
            result = await this.storage.get(sid);
        } else {
            result = this.storage.get(sid);
        }

        return result;
    }

    async delete (sid) {
        let result;

        if (!sid) {
            throw new Error('session sid required');
        }

        if (this.storage.delete.constructor.name === 'AsyncFunction') {
            result = await this.storage.delete(sid);
        } else {
            result = this.storage.delete(sid);
        }

        return result;
    }

    async create (data, secret) {
        secret = secret || this.secret;

        if (!data) {
            throw new Error('session data required');
        }

        if (!secret) {
            throw new Error('session secret required');
        }

        const sid = await this.sid();
        const cookie = await this.sign(sid, { secret });

        if (typeof data === 'object') {
            data.sid = sid;
        }

        if (this.storage.set.constructor.name === 'AsyncFunction') {
            await this.storage.set(sid, data);
        } else {
            this.storage.set(sid, data);
        }

        return cookie;
    }

};
