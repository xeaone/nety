'use strict';

const Path = require('path');
const Http = require('http');
const Mimes = require('./mimes');

const Utility = {};

Utility.mimes = Mimes;

Utility.statusString = function (code) {
	return JSON.stringify({
		code: code,
		message: Http.STATUS_CODES[code]
	});
};

Utility.createHeader = function (options) {
	const header = {};

	options = options || {};

	if (options.cache) {
		var cache;

		switch (typeof options.cache) {
			case 'string': {
				cache = options.cache;
				break;
			}
			case 'number': {
				cache = 'max-age=' + options.cache;
				break;
			}
			case 'boolean': {
				cache = 'max-age=' + 3600;
				break;
			}
		}

		header ['Cache-Control'] = cache;
	}

	if (options.cors) {
		if (typeof options.cors === 'object') {
			header['Access-Control-Allow-Origin'] = options.cors.origin;
			header['Access-Control-Allow-Methods'] = options.cors.methods;
			header['Access-Control-Allow-Headers'] = options.cors.headers;
			header['Access-Control-Request-Method'] = options.cors.requestMethod;
			header['Access-Control-Allow-Credentials'] = options.cors.credentials;

		} else if (options.cors === true) {
			header['Access-Control-Allow-Origin'] = '*';
			header['Access-Control-Request-Method'] = '*';
			header['Access-Control-Allow-Credentials'] = true;
			header['Access-Control-Allow-Methods'] = Http.METHODS.join(',');
			header['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
		}
	}

	if (options.path) {
		const ext = Path.extname(options.path) || 'default';
		const contentType = Utility.mimes[ext];
		header['Content-Type'] = `${contentType}; charset=utf8`;
	}

	return header;
};

module.exports = Utility;
