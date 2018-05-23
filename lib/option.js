'use strict';

const Os = require('os');
const Http = require('http');
const Mimes = require('./mimes');

const defaults = {
	port: 0,
	routes: [],
	auth: null,

	// header security
	xss: true,
	hsts: true,
	cors: false,
	xframe: true,
	xcontent: true,
	xdownload: true,

	cache: true,
	secure: null,
	mimes: Mimes,
	maxBytes: 1e6, // 1mb
	listener: null,
	information: {},
	methods: Http.METHODS,
	messages: Http.STATUS_CODES,
	methodsString: Http.METHODS.join(','),
	hostname: Os.hostname() || 'localhost',
	contentType: 'text/plain; charset=utf8',
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