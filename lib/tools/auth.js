'use strict';

module.exports = {
	name: 'auth',
	method: async function (context, auth) {
		const self = this;

		const authorization =
			context.request.headers['Authorization'] ||
			context.request.headers['authorization'] ||
			context.query.token;

		if (!authorization) {
			return { code: 401,  message: 'authorization header required' };
		}

		let pattern;

		if (auth.type) {
			pattern = new RegExp(auth.type, 'i');

			if (!authorization.match(pattern)) {
				return { code: 401,  message: 'authorization header type invalid' };
			}

		} else {
			pattern = /bearer|basic/ig;
		}

		const credential = authorization.replace(pattern, '').replace(/\s/g, '');

		if (!credential) {
			return { code: 401, message: 'authorization header requires credential' };
		}

		const strategyResult = await self.tool[auth['strategy']](context, credential, auth);
		console.log(strategyResult);

		if (!strategyResult || typeof strategyResult !== 'object') {
			return { code: 500, message: 'strategy object required' };
		}

		if (!strategyResult.credential || typeof strategyResult.credential !== 'object') {
			return { code: 500, message: 'strategy credential object required' };
		}

		if (!strategyResult.valid) {
			return { code: 401, message: strategyResult.message || 'strategy failed' };
		}

		const validateResult = await auth.validate(context, strategyResult.credential, auth);

		if (!validateResult || typeof validateResult !== 'object') {
			return { code: 500, message: 'validate object required' };
		}

		if (!validateResult.valid) {
			return { code: 401, message: validateResult.message || 'invalid credential' };
		}

		if (!validateResult.credential || typeof validateResult.credential !== 'object') {
			return { code: 500, message: 'validate credential object required' };
		}

		return {
			code: 200,
			credential: validateResult.credential
		};
	}
};
