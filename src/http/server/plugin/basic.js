'use strict';

module.exports = class Basic {

    constructor (options = {}) {

        this.scheme = 'basic';
        this.realm = options.realm || 'secure';
        this.format = options.format || 'base64';
        this.validate = options.validate || null;
        this.seperator = options.seperator || ':';

        if (typeof this.realm !== 'string') throw new Error('Basic - realm string required');
        if (typeof this.scheme !== 'string') throw new Error('Basic - scheme string  required');
        if (typeof this.validate !== 'function') throw new Error('Basic - validate function required');

    }

    async forbidden (context) {
        return context.code(403).end();
    }

    async unauthorized (context) {
        return context.code(401).head('www-authenticate', `${this.scheme} realm="${this.realm}"`).end();
    }

    async handle (context) {
        const header = context.headers['authorization'] || '';
        const authorization = header.replace(/basic/i, '').replace(/\s/g, '');

        if (!authorization) return this.unauthorized(context);

        const data = Buffer.from(authorization, this.format).toString('utf8');

        if (!data.includes(this.seperator)) return this.unauthorized(context);

        const [ username, password ] = data.split(this.seperator);

        if (!username || !password) return this.unauthorized(context);

        const validate = await this.validate(context, username, password);

        if (!validate || typeof validate !== 'object') {
            throw new Error('Basic - validate object required');
        }

        if (validate.forbidden) return this.forbidden(context);
        if (!validate.valid) return this.unauthorized(context);

        const credential = validate.credential;
        context.set('credential', credential);

    }

}
