'use strict';

module.exports = class Basic {

    constructor (options = {}) {
        this.scheme = 'basic';
        this.format = options.format || 'base64';
        this.seperator = options.seperator || ':';
    }

    async strategy (context) {
        const header = context.headers['authorization'] || '';
        const authorization = header.replace(/basic/i, '').replace(/\s/g, '');

        if (!authorization) {
            return { valid: false };
        }

        const data = Buffer.from(authorization, this.format).toString('utf8');

        if (data.indexOf(this.seperator) === -1) {
            return { valid: false };
        }

        const [ username, password ] = data.split(this.seperator);

        if (!username || !password) {
            return { valid: false };
        }

        return { valid: true, credential: { username, password } };
    }

}
