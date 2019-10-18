'use strict';

const Url = require('url').URL;

module.exports = class Normalizer {

    // constructor () {}

    async handler (context) {

        let redirect = false;
        let location = new Url(context.url.href);

        if (location.hostname.startsWith('www.')) {
            redirect = true;
            location.hostname = location.hostname.slice(4);
        }

        if (location.pathname !== '/' && location.pathname.endsWith('/')) {
            redirect = true;
            location.pathname = location.pathname.replace(/\/+/g,'/').slice(0, -1);
        }

        if (redirect) {
            context.response.writeHead(301, { 'Location': location.href });
            context.response.end();
        }

    }

}
