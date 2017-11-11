'use strict';

const Mimes = require('./mimes');
const Path = require('path');
const Http = require('http');

const Utility = {};

Utility.mimes = Mimes;

Utility.mimeByExt = function (ext) {
	const mimes = this.mimes;
	for (let mime in mimes) {
		if (mimes[mime].split(' ').indexOf(ext) !== -1) {
			return mime;
		}
	}
};

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
		} else if (options.cors === true) {
			header['Access-Control-Allow-Origin'] = '*';
			header['Access-Control-Allow-Methods'] = Http.METHODS.join(',');
			header['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
		}
	}

	if (options.path) {
		const ext = Path.extname(options.path).slice(1);
		if (ext) {
			const contentType = this.mimeByExt(ext);
			// const contentType = this.mimeByExt(ext) || 'application/octet-stream';
			header['Content-Type'] = contentType;
		}
	}

	// if (options.code) {
	// 	header['Code'] = options.code;
	// }

	return header;
};

module.exports = Utility;
