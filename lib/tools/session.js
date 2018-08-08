'use strict';

const Querystring = require('querystring');

module.exports = {
	name: 'session',
	method: async function (context, credential) {
		const self = this;

		if (!auth.secret) {
			return { valid: false, message: 'auth secret required' };
		}

		const data = Querystring.parse(credential);

		console.log(credential);
		console.log(data);

	}
};
