'use strict';

module.exports = {
	name: 'auth',
	value: async function (context, options) {
		const self = this;

		if (!options || typeof options !== 'object') {
			return { code: 500, message: 'auth options object required' };
		}

		if (!options.type || typeof options.type !== 'string') {
			return { code: 500, message: 'auth options type string required' };
		}

		if (options.validate) {

			if (typeof options.validate !== 'string' && typeof options.validate !== 'function') {
				return { code: 500, message: 'auth options validate string or function required' };
			}

			if (typeof options.validate === 'string' && !(options.validate in self.tool)) {
				return { code: 500, message: 'auth options validate not found in tools' };
			}

		} else {

			if (!(options.type in self.tool)) {
				return { code: 500, message: 'auth option type not found in tools for validate' };
			}

			if (!('validate' in self.tool[options.type])) {
				return { code: 500, message: 'auth option type validate not found on tool' };
			}

		}

		if (options.strategy) {

			if (typeof options.strategy !== 'string' && typeof options.strategy !== 'function') {
				return { code: 500, message: 'auth options strategy string or function required' };
			}

			if (typeof options.strategy === 'string' && !(options.strategy in self.tool)) {
				return { code: 500, message: 'auth options strategy not found in tools' };
			}

		} else {

			if (!(options.type in self.tool)) {
				return { code: 500, message: 'auth option type not found in tools for strategy' };
			}

			if (!('strategy' in self.tool[options.type])) {
				return { code: 500, message: 'auth option type strategy not found on tool' };
			}

		}

		let credential, validate, strategy;

		if (!options.validate) {
			validate = self.tool[options.type]['validate'].bind(self.tool[options.type]);
		} else if (typeof options.validate === 'string') {
			validate = self.tool[options.validate];
		} else if (typeof options.validate === 'function') {
			validate = options.validate;
		}

		if (!options.strategy) {
			strategy = self.tool[options.type]['strategy'].bind(self.tool[options.type]);
		} else if (typeof options.strategy === 'string') {
			strategy = self.tool[options.strategy];
		} else if (typeof options.strategy === 'function') {
			strategy = options.strategy;
		}

		options.name = options.name || 'cookie';
		options.realm = options.realm || 'secure';

		const cookie = context.request.headers['Cookie'] || context.request.headers['cookie'];
		const authorization = context.request.headers['Authorization'] || context.request.headers['authorization'];

		if (!authorization && !cookie) {
			context.head['WWW-Authenticate'] = `${options.type} realm="${options.realm}"`;
			return { code: 401, message: 'authorization header required' };
		} else if (cookie) {
			const items = cookie.split(/\s*\;\s*/);

			for (const item of items) {
				const parts = item.split(/\s*\=\s*/);
				const name = parts[0];

				if (name === options.name) {
					credential = decodeURI(parts[1]);
					break;
				}

			}
			
		} else if (authorization) {
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

		// Strategy Start

		const strategyResult = await strategy(context, credential, options);

		if (!strategyResult || typeof strategyResult !== 'object') {
			return { code: 500, message: 'auth strategy object required' };
		}

		if (!strategyResult.valid) {
			context.head['WWW-Authenticate'] = `${options.type} realm="${options.realm}"`;
			return { code: 401, message: strategyResult.message || 'auth strategy invalid credential' };
		}

		if (!strategyResult.credential || typeof strategyResult.credential !== 'object') {
			return { code: 500, message: 'auth strategy credential object required' };
		}

		credential = strategyResult.credential;

		// Strategy End

		// Validate Start

		const validateResult = await validate(context, credential, options);

		if (!validateResult || typeof validateResult !== 'object') {
			return { code: 500, message: 'auth validate object required' };
		}

		if (!validateResult.valid) {
			context.head['WWW-Authenticate'] = `${options.type} realm="${options.realm}"`;
			return { code: 401, message: validateResult.message || 'auth validate invalid credential' };
		}

		if (!validateResult.credential || typeof validateResult.credential !== 'object') {
			return { code: 500, message: 'auth validate credential object required' };
		}

		credential = validateResult.credential;

		// Validate End

		return { code: 200, credential };
	}
};
