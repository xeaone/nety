'use strict';

const Url = require('url').URL;

module.exports = class Normalize {

    async handle (context) {

        let redirect = false;
        const location = new Url(context.url.href);

        if (location.hostname.startsWith('www.')) {
            redirect = true;
            location.hostname = location.hostname.slice(4);
        }

        if (location.pathname.includes('//')) {
            redirect = true;
            location.pathname = location.pathname.replace(/\/+/g,'/');
        }

        if (location.pathname !== '/' && location.pathname.endsWith('/')) {
            redirect = true;
            location.pathname = location.pathname.slice(0, -1);
        }

        if (redirect) {
            await context.code(301).head('location', location.href).end();
        }

    }

}
