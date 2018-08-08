'use strict';

const Utility = require('./utility.js');
const JwtTool = require('./tools/jwt.js');
const AuthTool = require('./tools/auth.js');
const BasicTool = require('./tools/basic.js');
const CookieTool = require('./tools/cookie.js');
const StatusTool = require('./tools/status.js');
const StaticTool = require('./tools/static.js');
const SessionTool = require('./tools/session.js');
const RedirectTool = require('./tools/redirect.js');

const HeaderCacheTool = require('./tools/header/cache.js');
const HeaderSecurityTool = require('./tools/header/security.js');

const Wrap = function (name, value) {
	const self = this;

	if (!value) {
		return null;
	} else if (value.constructor.name === 'AsyncFunction' || value.constructor.name === 'Function') {
		return value.bind(self);
	// } else if (value.constructor.name === 'AsyncFunction') {
		// return async function () {
		// 	const result = await value.apply(self, arguments);
		//
		// 	if (typeof result !== 'object') {
		// 		throw new Error(`${name} tool return type invalid`);
		// 	}
		//
		// 	return result;
		// };
	// } else if (value.constructor.name === 'Function') {
		// return function () {
		// 	const result = value.apply(self, arguments);
		//
		// 	if (typeof result !== 'object') {
		// 		throw new Error(`${name} tool return type invalid`);
		// 	}
		//
		// 	return result;
		// };
	} else if (value.constructor.name === 'Object') {
		for (const key in value) {
			value[key] = Wrap.call(self, `${name}.${key}`, value[key]);
		}
	}

	return value;
};

module.exports = function Tool (data) {
	const self = this;
	const properties = {};

	const tools = [].concat(
		data || [],
		JwtTool,
		AuthTool,
		BasicTool,
		CookieTool,
		StatusTool,
		StaticTool,
		SessionTool,
		RedirectTool,
		HeaderCacheTool,
		HeaderSecurityTool
	);

	const property = {
		value: {},
		enumerable: true
	};

	for (const tool of tools) {

		if (tool.name in properties) {
			throw new Error('duplicate tool');
		} else {
			const name = Utility.toCamelCase(tool.name);
			const value = Wrap.call(self, name, tool.value);

			properties[name] = {
				enumerable: true,
				value: value
			};

		}

	}

	Object.defineProperty(self, 'tool', property);
	Object.defineProperties(self.tool, properties);
};
