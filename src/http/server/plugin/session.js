'use strict';

/*

    https://tools.ietf.org/html/rfc6896

*/

const Util = require('util');
const Crypto = require('crypto');
const QueryString = require('querystring');
const Pbkdf2 = Util.promisify(Crypto.pbkdf2);
const RandomBytes = Util.promisify(Crypto.randomBytes);

// 24 hours
const EXPIRATION = 1000*60*60*24;

module.exports = class Session {

    constructor (options = {}) {

        this.scheme = 'session';
        this.ignores = options.ignores || [];
        this.name = options.name || 'session';
        this.realm = options.realm || 'secure';
        this.validate = options.validate || null;
        this.seperator = options.seperator || '|';
        this.expiration = options.expiration || EXPIRATION;
        this.parse = typeof options.parse === 'boolean' ? options.parse : true;
        this.secure = typeof options.secure === 'boolean' ? options.secure : true;
        this.httpOnly = typeof options.httpOnly === 'boolean' ? options.httpOnly : true;
        this.sameSite = typeof options.sameSite === 'string' ? options.sameSite : 'strict';

        this.key = this.key || 64;
        this.salt = this.salt || 64;
        this.vector = this.vector || 16;
        this.hash = this.hash || 'sha256';
        this.encoding = options.encoding || 'hex';
        this.iterations = options.iterations || 999999;
        this.algorithm = options.algorithm || 'aes-256-gcm';

        this.secret = options.secret || null;
        this.signature = options.signature || null;

        if (typeof this.secret !== 'string') throw new Error('Session - secret string required');
        if (typeof this.signature !== 'string') throw new Error('Session - signature string required');

        if (typeof this.realm !== 'string') throw new Error('Session - realm string required');
        if (typeof this.scheme !== 'string') throw new Error('Session - scheme string  required');
        if (typeof this.validate !== 'function') throw new Error('Session - validate function required');

    }

    async encrypt (data, secret) {
        secret = secret || this.secret;

        if (!data) throw new Error('Session - data required');
        if (!secret) throw new Error('Session - secret required');

        const salt = await RandomBytes(this.salt);
        const vector = await RandomBytes(this.vector);
        const key = await Pbkdf2(secret, salt, this.iterations, this.key, this.hash);
        const cipher = Crypto.createCipheriv(this.algorithm, key, vector);

        return Buffer.concat([ cipher.update(data), cipher.final(), cipher.getAuthTag(), vector, salt ]).toString(this.encoding);
    }

    async decrypt (data, secret) {
        secret = secret || this.secret;

        if (!data) throw new Error('Session - data required');
        if (!secret) throw new Error('Session - secret required');

        const buffer = Buffer.from(data, this.encoding);
        const vector = buffer.splice(-this.vector);
        const salt = buffer.splice(-this.salt);
        const tag = buffer.splice(-this.tag);
        const key = await Pbkdf2(secret, salt, this.iterations, this.key, this.hash);
        const decipher = Crypto.createDecipheriv(this.algorithm, key, vector);

        decipher.setAuthTag(tag);

        return Buffer.concat([ decipher.update(buffer), decipher.final() ]).toString('utf8');
    }

    async sign (data, signature) {
        signature = signature || this.signature;

        if (!data) throw new Error('Session - data required');
        if (!signature) throw new Error('Session - signature required');

        const hmac = Crypto.createHmac(this.hash, signature).update(data);

        return [ data, hmac.digest(this.encoding) ].join(this.seperator);
    }

    async unsign (data, signature) {
        signature = signature || this.signature;

        if (!data) throw new Error('Session - data required');
        if (!signature) throw new Error('Session - signature required');

        const [ dataRaw, signatureRaw ] = data.split(this.seperator);

        const computed = Crypto.createHmac(this.hash, signatureRaw).update(dataRaw).digest(this.encoding);
        const signatureBuffer = Buffer.from(signatureRaw);
        const computedBuffer = Buffer.from(computed);

        if (computedBuffer.length !== signatureBuffer.length) return null;

        const valid = Crypto.timingSafeEqual(computedBuffer, signatureBuffer);
        return valid ? dataRaw : null;
    }

    async destroy (context) {
        let cookie = '';

        if (this.secure) cookie += ';Secure';
        if (this.httpOnly) cookie += ';HttpOnly';
        if (this.sameSite) cookie += `;SameSite=${this.sameSite}`;

        context.head('set-cookie', `${this.name}=${cookie};Max-Age=0`);
    }

    async create (context, data) {
        if (!data) throw new Error('Session - data required');

        const expiration = Date.now() + this.expiration;

        data = this.parse ? JSON.stringify(data) : data;
        data = await this.encrypt(data);
        data = [ data, `${expiration}`.toString(this.encoding) ].join(this.seperator);
        data = await this.sign(data);

        if (this.secure) data += ';Secure';
        if (this.httpOnly) data += ';HttpOnly';
        if (this.sameSite) data += `;SameSite=${this.sameSite}`;

        if (this.maxAge) data += `;Max-Age=${this.maxAge}`;
        else data += `;Max-Age=${expiration}`;

        context.head('set-cookie', `${this.name}=${data}`);
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
            create: this.create.bind(this, context),
            destroy: this.destroy.bind(this, context)
        });

        const ignores = this.ignores;
        const method = context.method;
        const path = context.url.pathname;

        const ignored = ignores.find(ignore => [path, method].includes(ignore));
        if (ignored) return;

        const cookie = await this.cookie(context);
        if (!cookie) return this.unauthorized(context);

        const parts = cookie.split(this.seperator);
        if (parts.length !== 3) return this.forbidden(context);

        const expiration = Number(Buffer.from(parts[1], this.encoding).toString('utf8'));
        if (expiration <= Date.now()) return this.forbidden(context);

        const unsigned = await this.unsign(`${parts[0]}${this.seperator}${parts[2]}`);
        if (!unsigned) return this.unauthorized(context);

        const decrypted = await this.decrypt(unsigned);
        if (!decrypted) return this.unauthorized(context);

        const data = this.parse ? JSON.parse(decrypted) : decrypted;

        const validate = await this.validate(context, data);

        if (!validate || typeof validate !== 'object') {
            throw new Error('Session - validate object required');
        }

        if (validate.forbidden) return this.forbidden(context);
        if (!validate.valid) return this.unauthorized(context);

        context.set('credential', validate.credential);
    }

}
