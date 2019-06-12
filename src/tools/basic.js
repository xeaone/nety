'use strict';

module.exports = class Basic {

    constructor (option) {
        option = option || {};
        this.realm = option.realm || 'secure';
        this.scheme = option.scheme || 'basic';
        this.format = option.format || 'base64';
        this.seperator = option.seperator || ':';
    }

    async strategy (context, option) {
        const authorization = context.request.headers['Authorization'] || context.request.headers['authorization'] || '';
        const scheme = new RegExp(this.scheme, 'i');
        const encoded = authorization.replace(scheme, '').replace(/\s/g, '');

        if (!encoded) {
            return { valid: false, message: 'auth basic invalid authorization scheme' };
        }

        const credential = Buffer.from(encoded, this.format).toString('utf8');

        if (credential.indexOf(this.seperator) === -1) {
            return { valid: false, message: 'auth basic invalid authorization format' };
        }

        const parts = credential.split(this.seperator);
        const decoded = { username: parts[0], password: parts[1] };

        return { valid: true, credential: { decoded, encoded } };
    }

};
