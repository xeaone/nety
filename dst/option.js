'use strict';

const Os = require('os');
const Http = require('http');
const Mimes = require('./mimes.js');

const defaults = {
    port: 0,
    tools: [],
    routes: [],
    auth: null,

    context: null,

    // header security
    xss: true,
    hsts: true,
    cors: false,
    xframe: true,
    xcontent: true,
    xdownload: true,

    debug: false,

    cache: true,
    secure: null,
    mimes: Mimes,
    maxBytes: 1e6, // 1mb
    listener: null,
    // information: {},
    methods: Http.METHODS,
    messages: Http.STATUS_CODES,
    methodsString: Http.METHODS.join(','),
    hostname: Os.hostname() || 'localhost',

    charset: 'charset=utf8',
    contentType: 'text/plain',

    event: {}
};

module.exports = function Options (options) {
    const self = this;

    for (let route of options.routes) {

        if (typeof route !== 'object') {
            throw new Error('route type invalid');
        }

        if (!route.path) {
            throw new Error('route path required');
        }

        if (!route.method) {
            throw new Error('route method required');
        }

        if (!route.handler) {
            throw new Error('route handler required');
        }

    }

    for (let name in defaults) {

        let property = {
            enumerable: true
        };

        if (options[name] === undefined) {
            property.value = defaults[name];
        } else {
            property.value = options[name];
        }

        Object.defineProperty(self, name, property);
    }

};
