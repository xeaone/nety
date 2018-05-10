'use strict';

module.exports = {
	name: 'jwt',
	method: async function (context, validate) {

		const authorization = context.request.headers['Authorization'];

		if (!authorization) {
			return { code: 401 };
		}

		const parts = authorization.split(/\s+/);

		if (parts.length !== 2) {
			return { code: 400, message: 'bad authorization header syntax' };
		}

		const type = parts[0];

		if (type.toLowerCase() !== 'bearer') {
			return { code: 401 };
		}

		let credentials = parts[1];

		if (!credentials) {
			return { code: 401, message: 'authentication header missing credentials' };
		}

		// do jwt stuff

		const data = await validate(context, credentials);

		if (!data || typeof data !== 'object') {
			return { code: 500, message: 'validate object required' };
		}

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
