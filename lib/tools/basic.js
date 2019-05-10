'use strict';

module.exports = class Basic {

    constructor (option) {
        option = option || {};
        this.realm = option.realm || 'secure';
        this.scheme = option.scheme || 'basic';
        this.format = option.format || 'base64';
        this.seperator = option.seperator || ':';
    }

    async strategy (encoded, option) {
        const format = option.format || this.format;
        const seperator = option.seperator || this.seperator;

        const credential = Buffer.from(encoded, format).toString();

        if (credential.indexOf(seperator) === -1) {
            return { valid: false, message: 'auth basic invalid authorization format' };
        }

        const parts = credential.split(seperator);
        const decoded = { username: parts[0], password: parts[1] };

        return { valid: true, credential: { decoded, encoded } };
    }

};
