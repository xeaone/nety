'use strict';

module.exports = {
	name: 'auth',
	method: async function (context, auth) {
		const self = this;

		let authorization;

		if (auth.location === 'query') {
			authorization = context.query.token;
		} else if (auth.location === 'cookie') {
			console.warn('cookie not supported');
		} else {
			authorization = context.request.headers['Authorization'] || context.request.headers['authorization'];
		}

		if (!authorization) {
			return { code: 401,  message: 'authorization credential required' };
		}

		let pattern;

		if (auth.type) {
			pattern = new RegExp(auth.type, 'i');

			if (!authorization.match(pattern)) {
				return { code: 401,  message: 'authorization type invalid' };
			}

		} else {
			pattern = /bearer|basic/ig;
		}

		const credential = authorization.replace(pattern, '').replace(/\s/g, '');

		if (!credential) {
			return { code: 401, message: 'authorization credential required' };
		}

		const strategyResult = await self.tool[auth.strategy](context, credential, auth);

		if (!strategyResult || typeof strategyResult !== 'object') {
			return { code: 500, message: 'auth strategy object required' };
		}

		if (!strategyResult.valid) {
			return { code: 401, message: strategyResult.message || 'strategy failed' };
		}

		if (!strategyResult.credential || typeof strategyResult.credential !== 'object') {
			return { code: 500, message: 'auth strategy credential object required' };
		}

		const validateResult = await auth.validate(context, strategyResult.credential, auth);

		if (!validateResult || typeof validateResult !== 'object') {
			return { code: 500, message: 'auth validate object required' };
		}

		if (!validateResult.valid) {
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
