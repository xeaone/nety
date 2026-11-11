import type Context from '../context.js';
import type { ValidationResult } from '../types.js';

export type BasicValidator = (
    context: Context,
    username: string,
    password: string,
) => ValidationResult | Promise<ValidationResult>;

export interface BasicOptions {
    realm?: string;
    format?: BufferEncoding;
    validate?: BasicValidator;
    separator?: string;
}

export default class Basic {
    separator = ':';
    scheme = 'basic';
    realm = 'secure';
    format: BufferEncoding = 'base64';
    validate: BasicValidator | null = null;

    constructor(options: BasicOptions = {}) {
        Object.assign(this, options);

        if (typeof this.realm !== 'string') throw new Error('Basic - realm string required');
        if (typeof this.scheme !== 'string') throw new Error('Basic - scheme string  required');
        if (typeof this.validate !== 'function') throw new Error('Basic - validate function required');
    }

    async forbidden(context: Context) {
        return context.code(403).end();
    }

    async unauthorized(context: Context) {
        return context.code(401).head('www-authenticate', `${this.scheme} realm="${this.realm}"`).end();
    }

    async handle(context: Context) {
        const value = context.headers['authorization'];
        const header = (Array.isArray(value) ? value[0] : value) || '';
        const authorization = header.replace(/basic/i, '').replace(/\s/g, '');

        if (!authorization) return this.unauthorized(context);

        const data = Buffer.from(authorization, this.format).toString('utf8');

        if (!data.includes(this.separator)) return this.unauthorized(context);

        const [username, password] = data.split(this.separator);

        if (!username || !password) return this.unauthorized(context);

        const validate = await this.validate!(context, username, password);

        if (!validate || typeof validate !== 'object') {
            throw new Error('Basic - validate object required');
        }

        if (validate.forbidden) return this.forbidden(context);
        if (!validate.valid) return this.unauthorized(context);

        const credential = validate.credential;
        context.set('credential', credential);
    }
}
