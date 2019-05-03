'use strict';

module.exports = {
    name: 'redirect',
    value: async function (context, url) {
        return {
            code: 301,
            head: {
                'location': url
            }
        };
    }
};
