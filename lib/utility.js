'use strict';

const Http = require('http');
const Path = require('path');
const Mimes = require('./mimes.js');

module.exports = {

	mimes: Mimes,
	methods: Http.METHODS,
	messages: Http.STATUS_CODES,

	statusString (code, message) {
		return JSON.stringify({
			code: code,
			message: message || this.messages[code]
		});
	},

	methodNormalize (method) {
		return typeof method === 'string' ? method.toUpperCase() : method.map(function (item) {
			return item.toUpperCase();
		});
	},

	toCamelCase (data) {
		data = data.slice(0, 1).toLowerCase() + data.slice(1);
		return data.replace(/(\_+|\-+|\s+)([a-zA-z])/g, function (string) {
			return string.slice(-1).toUpperCase();
		});
	},

	// assign (target, options, defaults) {
	//
	// 	for (let name in defaults) {
	// 		let property = { enumerable: true };
	//
	// 		if (options[name] === undefined) {
	// 			property.value = defaults[name];
	// 		} else {
	// 			property.value = options[name];
	// 		}
	//
	// 		Object.defineProperty(target, name, property);
	// 	}
	//
	//     return target;
	// },

	async getMime (data) {
		data = data || '';

		if (data.includes('.')){
			data = Path.extname(data).slice(1);
		}

		return this.mimes[data || 'txt'];
	}

};
