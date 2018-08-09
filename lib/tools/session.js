'use strict';

const Querystring = require('querystring');


module.exports = {
	name: 'session',
	value: async function (context, credential, auth) {
		const self = this;

		if (!auth.secret) {
			return { valid: false, message: 'auth secret required' };
		}

		const data = await context.tool.cookie.decode(credential);

		// TODO: verify signed cookie

		// const data = Querystring.parse(credential);

		console.log(credential);
		console.log(data);

	}
};
