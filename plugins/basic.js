'use strict';

module.exports = {
	name: 'basic',
	method: async function (request, response) {

		const authorization = request.headers['authorization'];

		if (!authorization) {
			return { code: 401 };
		}

		const parts = authorization.split(/\s+/);

		if (parts.length !== 2) {
			return { code: 400, message: 'bad authorization header syntax' };
		}

		const type = parts[0];

		if (type.toLowerCase() !== 'basic') {
			return { code: 401 };
		}

		let credentials = parts[1];

		if (!credentials.includes(':')) {
			credentials = Buffer.from(credentials, 'base64').toString();
		}

		const separator = credentials.indexOf(':');

		if (separator === -1) {
			return { code: 400, message: 'bad authorization header syntax' };
		}

		const username = credentials.slice(0, separator);
		const password = credentials.slice(separator + 1);

		if (!username || !password) {
			return { code: 401, message: 'authentication header missing credential' };
		}

		// if (!this.auth.validate) {
		// 	throw new Error('auth validate method required');
		// }

		const data = await this.auth.validate(username, password, request, response);

		if (!data.valid) {
			return { code: 401, message: 'invalid credentials' };
		}

		if (!data.credentials || typeof data.credentials !== 'object') {
			return { code: 500, message: 'credentials object required' };
		}

		return {
			code: 200,
			credentials: data.credentials
		};
	}
};
