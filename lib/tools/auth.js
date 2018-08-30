'use strict';

module.exports = {
	name: 'auth',
	value: async function (context, options) {
		const self = this;

		if (!options || typeof options !== 'object') {
			return { code: 500, message: 'auth options object required' };
		}

		if (!options.validate || typeof options.validate !== 'string' && typeof options.validate !== 'function') {
			return { code: 500, message: 'auth options validate string or function required' };
		}

		if (typeof options.validate === 'string' && !(options.validate in self.tool)) {
			return { code: 500, message: 'auth options validate not found in tools' };
		}

		if (!options.type || typeof options.type !== 'string') {
			return { code: 500, message: 'auth options type string required' };
		}

		if (options.type !== 'basic' && options.type !== 'cookie') {

			if (!options.strategy || typeof options.strategy !== 'string' && typeof options.strategy !== 'function') {
				return { code: 500, message: 'auth options strategy string or function required' };
			}

			if (typeof options.strategy === 'string' && !(options.strategy in self.tool)) {
				return { code: 500, message: 'auth options strategy not found in tools' };
			}

		}

		let credential;
		let validate = typeof options.validate === 'string' ? self.tool[options.validate] : options.validate;
		let strategy = typeof options.strategy === 'string' ? self.tool[options.strategy] : options.strategy;

		options.realm = options.realm || 'Secure';

		if (options.type === 'cookie') {
			const cookie = context.request.headers['Cookie'] || context.request.headers['cookie'];
			credential = await self.tool.cookie.parse(cookie);
		} else {
			const authorization = context.request.headers['Authorization'] || context.request.headers['authorization'];

			if (!authorization) {
				context.head['WWW-Authenticate'] = `${options.type} realm="${options.realm}"`;
				return { code: 401, message: 'authorization header required' };
			}

			const pattern = new RegExp(options.type, 'i');

			if (!authorization.match(pattern)) {
				context.head['WWW-Authenticate'] = `${options.type} realm="${options.realm}"`;
				return { code: 401,  message: 'authorization type invalid' };
			}

			credential = authorization.replace(pattern, '').replace(/\s/g, '');
		}

		if (!credential) {
			context.head['WWW-Authenticate'] = `${options.type} realm="${options.realm}"`;
			return { code: 401, message: 'authorization credential required' };
		}

		if (options.type === 'basic') {
			credential = await self.tool.basic.strategy(context, credential, options);
		} else {
			let result;

			if (options.type === 'cookie') {
				result = await self.tool.cookie.strategy(context, credential, options);
			} else {
				result = await strategy(context, credential, options);
			}

			if (!result || typeof result !== 'object') {
				return { code: 500, message: 'auth strategy object required' };
			}

			if (!result.valid) {
				context.head['WWW-Authenticate'] = `${options.type} realm="${options.realm}"`;
				return { code: 401, message: result.message || 'auth strategy invalid' };
			}

			if (!result.credential || typeof result.credential !== 'object') {
				return { code: 500, message: 'auth strategy credential object required' };
			}

			credential = result.credential;
		}

		if (!credential) {
			context.head['WWW-Authenticate'] = `${options.type} realm="${options.realm}"`;
			return { code: 401, message: 'authorization credential invalid' };
		}

		const validateResult = await validate(context, credential, options);

		if (!validateResult || typeof validateResult !== 'object') {
			return { code: 500, message: 'auth validate object required' };
		}

		if (!validateResult.valid) {
			context.head['WWW-Authenticate'] = `${options.type} realm="${options.realm}"`;
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
