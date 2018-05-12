'use strict';

module.exports = {
	name: 'basic',
	method: async function (context, credential) {
		const self = this;

		const credentials = Buffer.from(credential, 'base64').toString();
		const separator = credentials.indexOf(':');

		if (separator === -1) {
			return { valid: false, message: 'invalid authorization header format' };
		}

		const username = credentials.slice(0, separator);
		const password = credentials.slice(separator + 1);

		if (!username || !password) {
			return { valid: false, message: 'authentication header missing credential' };
		}

		return { valid: true, credential: { username, password } };
	}
};
