'use strict';

module.exports = {
    name: 'redirect',
    value: async function (url, option) {
        option = option || {};

        this.context.head.location = url;
        this.context.code = option.code || 301;

        this.context.head['content-type'] = 'text/html';

        this.context.body = option.body || `
        <!DOCTYPE html>
        <html>
        <head>
            <title>301 Moved Permanently</title>
        </head>
        <body>
            <h1>Moved Permanently</h1>
            <p>The document has moved <a href="${url}">${url}</a>.</p>
        </body>
        </html>
        `;

        return this.context;
    }
};
