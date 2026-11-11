/*
    Base64 URL: https://www.ietf.org/rfc/rfc4648.txt
    Secure Session Cookies: https://tools.ietf.org/html/rfc6896
*/

import Util from 'node:util';
import Crypto, { type CipherGCMTypes } from 'node:crypto';
import QueryString from 'node:querystring';

import type Context from '../context.js';
import type { ValidationResult } from '../types.js';

export type SessionValidator = (context: Context, data: unknown) => ValidationResult | Promise<ValidationResult>;

export interface SessionOptions {
    ignores?: string[];
    name?: string;
    realm?: string;
    validate?: SessionValidator;
    expiration?: number;
    parse?: boolean;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: string;
    key?: number;
    tag?: number;
    salt?: number;
    vector?: number;
    hash?: string;
    iterations?: number;
    algorithm?: CipherGCMTypes;
    secret?: string;
    signature?: string;
    maxAge?: number;
}

const Pbkdf2 = Util.promisify(Crypto.pbkdf2);
const RandomBytes = Util.promisify(Crypto.randomBytes);

// 24 hours
const EXPIRATION = 1000 * 60 * 60 * 24;

export default class Session {
    scheme = 'session';
    ignores: string[] = [];
    name = 'session';
    realm = 'secure';
    validate: SessionValidator | null = null;
    expiration = EXPIRATION;
    parse = true;
    secure = true;
    httpOnly = true;
    sameSite = 'strict';
    key = 32;
    tag = 16;
    salt = 16;
    vector = 16;
    hash = 'sha512';
    iterations = 10000;
    algorithm: CipherGCMTypes = 'aes-256-gcm';
    secret: string | null = null;
    signature: string | null = null;
    maxAge: number | undefined = undefined;

    constructor(options: SessionOptions = {}) {
        Object.assign(this, options);

        if (typeof this.secret !== 'string') throw new Error('Session - secret string required');
        if (typeof this.signature !== 'string') throw new Error('Session - signature string required');

        if (typeof this.realm !== 'string') throw new Error('Session - realm string required');
        if (typeof this.scheme !== 'string') throw new Error('Session - scheme string  required');
        if (typeof this.validate !== 'function') throw new Error('Session - validate function required');
    }

    // box () {
    //     return [ ...arguments ].join('|');
    // }
    //
    // unbox (data) {
    //     return data.split('|');
    // }

    encode(data: string | Buffer): string {
        return Buffer.from(data).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    decode(data: string): Buffer {
        return Buffer.from((data + '==='.slice((data.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    }

    async encrypt(data: string | Buffer, secret?: string): Promise<string> {
        const effectiveSecret = secret || this.secret;

        if (!data) throw new Error('Session - data required');
        if (!effectiveSecret) throw new Error('Session - secret required');

        const salt = await RandomBytes(this.salt);
        const vector = await RandomBytes(this.vector);
        const key = await Pbkdf2(effectiveSecret, salt, this.iterations, this.key, this.hash);
        const cipher = Crypto.createCipheriv(this.algorithm, key, vector);

        const encrypted = Buffer.concat([cipher.update(data), cipher.final(), cipher.getAuthTag(), salt, vector]);

        return this.encode(encrypted);
    }

    async decrypt(encrypted: string, secret?: string): Promise<string> {
        const effectiveSecret = secret || this.secret;

        if (!encrypted) throw new Error('Session - encrypted required');
        if (!effectiveSecret) throw new Error('Session - secret required');

        const decoded = this.decode(encrypted);

        const vector = decoded.slice(-this.vector);
        const salt = decoded.slice(-(this.salt + this.vector), -this.vector);
        const tag = decoded.slice(-(this.tag + this.salt + this.vector), -(this.salt + this.vector));
        const data = decoded.slice(0, -(this.tag + this.salt + this.vector));

        const key = await Pbkdf2(effectiveSecret, salt, this.iterations, this.key, this.hash);
        const decipher = Crypto.createDecipheriv(this.algorithm, key, vector);

        decipher.setAuthTag(tag);

        const buffer = Buffer.concat([decipher.update(data), decipher.final()]);

        return buffer.toString('utf8');
    }

    async sign(encrypted: string, stamped: string, signature?: string): Promise<string> {
        const effectiveSignature = signature || this.signature;

        if (!encrypted) throw new Error('Session - encrypted required');
        if (!stamped) throw new Error('Session - stamped required');
        if (!effectiveSignature) throw new Error('Session - signature required');

        const signed = Crypto.createHmac(this.hash, effectiveSignature).update(`${encrypted}|${stamped}`).digest();

        return this.encode(signed);
    }

    async unsign(encrypted: string, stamped: string, signed: string, signature?: string): Promise<boolean> {
        const effectiveSignature = signature || this.signature;

        if (!encrypted) throw new Error('Session - encrypted required');
        if (!stamped) throw new Error('Session - stamped required');
        if (!signed) throw new Error('Session - signed required');
        if (!effectiveSignature) throw new Error('Session - signature required');

        const decoded = this.decode(signed);

        const computed = Crypto.createHmac(this.hash, effectiveSignature).update(`${encrypted}|${stamped}`).digest();

        if (computed.byteLength !== decoded.byteLength) return false;

        return Crypto.timingSafeEqual(computed, decoded);
    }

    async stamp(time: number): Promise<string> {
        if (!time) throw new Error('Session - time required');
        const expiration = time + this.expiration;
        return this.encode(Buffer.from(`${expiration}`, 'utf8'));
    }

    async unstamp(time: string): Promise<boolean> {
        if (!time) throw new Error('Session - time required');

        const decoded = this.decode(time).toString('utf8');
        const expiration = Number(decoded);

        if (!expiration) return false;

        return Date.now() < expiration;
    }

    async create(context: Context, data: string | Buffer): Promise<void> {
        if (!data) throw new Error('Session - data required');

        const time = Date.now();
        const parsed = this.parse ? JSON.stringify(data) || '' : data;
        const encrypted = await this.encrypt(parsed);
        const stamped = await this.stamp(time);
        const signed = await this.sign(encrypted, stamped);

        let cookie = `${this.name}=${encrypted}|${stamped}|${signed}`;

        if (this.secure) cookie += ';Secure';
        if (this.httpOnly) cookie += ';HttpOnly';
        if (this.sameSite) cookie += `;SameSite=${this.sameSite}`;

        if (this.maxAge) cookie += `;Max-Age=${this.maxAge}`;
        else cookie += `;Max-Age=${time + this.expiration}`;

        if (Buffer.byteLength(cookie) > 4090) throw new Error('Session - cookie size invalid');

        context.head('set-cookie', cookie);
    }

    async destroy(context: Context): Promise<void> {
        let cookie = '';

        if (this.secure) cookie += ';Secure';
        if (this.httpOnly) cookie += ';HttpOnly';
        if (this.sameSite) cookie += `;SameSite=${this.sameSite}`;

        context.head('set-cookie', `${this.name}=${cookie};Max-Age=0`);
    }

    async forbidden(context: Context) {
        return context.code(403).end();
    }

    async unauthorized(context: Context) {
        return context.code(401).head('www-authenticate', `${this.scheme} realm="${this.realm}"`).end();
    }

    async cookie(context: Context): Promise<string | null> {
        const value = context.headers['cookie'];
        const header = (Array.isArray(value) ? value[0] : value) || '';
        const cookies = header.split(/\s*;\s*/);

        for (const cookie of cookies) {
            const [name, value] = cookie.split(/\s*=\s*/);
            if (name === this.name) {
                return QueryString.unescape(value);
            }
        }

        return null;
    }

    async handle(context: Context) {
        context.set('session', {
            create: this.create.bind(this, context),
            destroy: this.destroy.bind(this, context),
        });

        const ignores = this.ignores;
        const method = context.method;
        const path = context.url.pathname;

        const ignored = ignores.find((ignore) => [path, method].includes(ignore));
        if (ignored) return;

        const cookie = await this.cookie(context);
        if (!cookie) return this.unauthorized(context);

        const unboxed = cookie.split('|');
        if (unboxed.length !== 3) return this.unauthorized(context);

        const [encrypted, stamped, signed] = unboxed;

        const unsigned = await this.unsign(encrypted, stamped, signed);
        if (!unsigned) return this.unauthorized(context);

        const unstamped = await this.unstamp(stamped);
        if (!unstamped) return this.unauthorized(context);

        const decrypted = await this.decrypt(encrypted);
        if (!decrypted) return this.unauthorized(context);

        const data = this.parse ? JSON.parse(decrypted) : decrypted;

        const validate = await this.validate!(context, data);

        if (!validate || typeof validate !== 'object') {
            throw new Error('Session - validate object required');
        }

        if (validate.forbidden) return this.forbidden(context);
        if (!validate.valid) return this.unauthorized(context);

        context.set('credential', validate.credential);
    }
}
