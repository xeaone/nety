'use strict';

const Http = require('http');
const Mimes = require('./mimes');

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

	// merge (target, source) {
	// 	target = target || {};
	// 	source = source || {};
	//
	// 	for (let name in source) {
	// 		if (target[name] === undefined) {
	// 			target[name] = source[name];
	// 		}
	// 	}
	//
	//     return target;
	// }

};
