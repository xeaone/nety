'use strict';

module.exports = class Auth {

    constructor (options = {}) {
        this.scheme = options.scheme;
        this.validate = options.validate;
        this.strategy = options.strategy;
        this.realm = options.realm || 'secure';

        // if (options.basic) {
        //     const basic = typeof options.basic === 'object' ? { ...options.basic } : {};
        //     if (typeof options.basic === 'function') this.validate = options.basic;
        //     basic.format = basic.format || 'base64';
        //     basic.seperator = basic.seperator || ':';
        //     this.strategy = Basic.bind(basic);
        //     this.scheme = this.scheme || basic.scheme || 'basic';
        // }

        if (typeof this.strategy !== 'string' && typeof this.strategy !== 'function') {
            throw new Error('Auth - strategy required');
        }

        if (typeof this.validate !== 'string' && typeof this.validate !== 'function') {
            throw new Error('Auth - validate required');
        }

        if (typeof this.realm !== 'string') {
            throw new Error('Auth - realm required');
        }

        if (typeof this.scheme !== 'string') {
            throw new Error('Auth - scheme required');
        }

    }

    async handle (context) {

        let credential;
        const cookie = context.headers['cookie'];
        const authorization = context.headers['authorization'];

        credential = { authorization, cookie };

        const strategy = await this.strategy(context, credential);

        if (!strategy || typeof strategy !== 'object') {
            throw new Error('Auth - strategy object required');
        }

        if (strategy.forbidden) {
            return context.code(403).end();
        }

        if (!strategy.valid) {
            return context.code(401).head('www-authenticate', `${this.scheme} realm="${this.realm}"`).end();
        }

        credential = strategy.credential;

        const validate = await this.validate(context, credential);

        if (!validate || typeof validate !== 'object') {
            throw new Error('Auth - validate object required');
        }

        if (validate.forbidden) {
            return context.code(403).end();
        }

        if (!validate.valid) {
            return context.code(401).head('www-authenticate', `${this.scheme} realm="${this.realm}"`).end();
        }

        credential = validate.credential;
        context.set('credential', credential);

        return credential;
    }

}
