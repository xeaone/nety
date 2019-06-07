'use strict';

module.exports = {
    name: 'redirect',
    value: async function (url, code) {
        this.context.code = code || 301;
        this.context.head.location = url;
        return this.context;
    }
};
