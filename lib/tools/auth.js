'use strict';

module.exports = {
	name: 'auth',
	value: async function (context, auth) {
		const self = this;

		if (!auth || typeof auth !== 'object') {
			return { code: 500, message: 'auth options object required' };
		}

		if (!auth.strategy || typeof auth.scheme !== 'string') {
			return { code: 500, message: 'auth strategy string required' };
		}

		if (!auth.scheme || typeof auth.scheme !== 'string') {
			return { code: 500, message: 'auth scheme string required' };
		}

		if (!auth.validate || typeof auth.validate !== 'function') {
			return { code: 500, message: 'auth validate function required' };
		}

		if (!(auth.strategy in self.tool)) {
			return { code: 500, message: 'auth strategy tool not found' };
		}

		let credential;

		if (auth.scheme === 'query') {
			credential = context.query.token;
		} else if (auth.scheme === 'cookie') {
			credential = context.request.headers['Cookie'] || context.request.headers['cookie'];
		} else {
			const authorization = context.request.headers['Authorization'] || context.request.headers['authorization'];
			const pattern = new RegExp(auth.scheme, 'i');

			if (!authorization.match(pattern)) {
				context.head['WWW-Authenticate'] = `${auth.scheme} realm="${auth.realm || 'Secure'}"`;
				return { code: 401,  message: 'authorization scheme invalid' };
			}

			credential = authorization.replace(pattern, '').replace(/\s/g, '');
		}

		if (!credential) {
			context.head['WWW-Authenticate'] = `${auth.scheme} realm="${auth.realm || 'Secure'}"`;
			return { code: 401, message: 'authorization credential required' };
		}

		const strategyResult = await self.tool[auth.strategy](context, credential, auth);

		if (!strategyResult || typeof strategyResult !== 'object') {
			return { code: 500, message: 'auth strategy object required' };
		}

		if (!strategyResult.valid) {
			context.head['WWW-Authenticate'] = `${auth.scheme} realm="${auth.realm || 'Secure'}"`;
			return { code: 401, message: strategyResult.message || 'invalid strategy' };
		}

		if (!strategyResult.credential || typeof strategyResult.credential !== 'object') {
			return { code: 500, message: 'auth strategy credential object required' };
		}

		const validateResult = await auth.validate(context, strategyResult.credential, auth);

		if (!validateResult || typeof validateResult !== 'object') {
			return { code: 500, message: 'auth validate object required' };
		}

		if (!validateResult.valid) {
			context.head['WWW-Authenticate'] = `${auth.scheme} realm="${auth.realm || 'Secure'}"`;
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
