'use strict';

module.exports = {
	name: 'auth',
	value: async function (context, auth) {
		const self = this;

		if (!auth || typeof auth !== 'object') {
			return { code: 500, message: 'auth options object required' };
		}

		if (!auth.validate || typeof auth.validate !== 'function') {
			return { code: 500, message: 'auth options validate function required' };
		}

		if (!auth.type || typeof auth.type !== 'string') {
			return { code: 500, message: 'auth options type string required' };
		}

		if (auth.type !== 'basic') {

			if (!auth.strategy || typeof auth.strategy !== 'string' && typeof auth.strategy !== 'function') {
				return { code: 500, message: 'auth options strategy string or function required' };
			}

			if (typeof auth.strategy === 'string' && !(auth.strategy in self.tool)) {
				return { code: 500, message: 'auth options strategy not found in tools' };
			}

		}

		let credential;

		if (auth.type === 'cookie') {
			credential = context.request.headers['Cookie'] || context.request.headers['cookie'];
		} else {
			const authorization = context.request.headers['Authorization'] || context.request.headers['authorization'];

			if (!authorization) {
				context.head['WWW-Authenticate'] = `${auth.type} realm="${auth.realm || 'Secure'}"`;
				return { code: 401, message: 'authorization header required' };
			}

			const pattern = new RegExp(auth.type, 'i');

			if (!authorization.match(pattern)) {
				context.head['WWW-Authenticate'] = `${auth.type} realm="${auth.realm || 'Secure'}"`;
				return { code: 401,  message: 'authorization type invalid' };
			}

			credential = authorization.replace(pattern, '').replace(/\s/g, '');
		}

		if (!credential) {
			context.head['WWW-Authenticate'] = `${auth.type} realm="${auth.realm || 'Secure'}"`;
			return { code: 401, message: 'authorization credential required' };
		}

		if (auth.type === 'basic') {
			credential = Buffer.from(credential, 'base64').toString();

			if (credential.indexOf(':') === -1) {
				return { code: 500, message: 'authorization header format invalid' };
			}

			const parts = credential.split(':');

			credential = { username: parts[0], password: parts[1] };
		} else {
			const result = await self.tool[auth.strategy](context, credential, auth);

			if (!result || typeof result !== 'object') {
				return { code: 500, message: 'auth strategy object required' };
			}

			if (!result.valid) {
				context.head['WWW-Authenticate'] = `${auth.type} realm="${auth.realm || 'Secure'}"`;
				return { code: 401, message: result.message || 'invalid strategy' };
			}

			if (!result.credential || typeof result.credential !== 'object') {
				return { code: 500, message: 'auth strategy credential object required' };
			}

			credential = result.credential;
		}

		const validateResult = await auth.validate(context, credential, auth);

		if (!validateResult || typeof validateResult !== 'object') {
			return { code: 500, message: 'auth validate object required' };
		}

		if (!validateResult.valid) {
			context.head['WWW-Authenticate'] = `${auth.type} realm="${auth.realm || 'Secure'}"`;
			return { code: 401, message: validateResult.message || 'invalid credential' };
		}

		if (!validateResult.credential || typeof validateResult.credential !== 'object') {
			return { code: 500, message: 'auth validate credential object required' };
		}

		return {
			code: 200,
			credential: validateResult.credential
		};
	}
};
