'use strict';

module.exports = {
    name: 'redirect',
    value: async function (url) {
        this.context.code = 301;
        this.context.head.location = url;
        return this.context;
    }
};
