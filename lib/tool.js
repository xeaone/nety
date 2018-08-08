'use strict';

const Utility = require('./utility.js');
const JwtTool = require('./tools/jwt.js');
const AuthTool = require('./tools/auth.js');
const BasicTool = require('./tools/basic.js');
const StatusTool = require('./tools/status.js');
const StaticTool = require('./tools/static.js');
const SessionTool = require('./tools/session.js');
const RedirectTool = require('./tools/redirect.js');

const HeaderCacheTool = require('./tools/header/cache.js');
const HeaderSecurityTool = require('./tools/header/security.js');

module.exports = function Tool (data) {
	const self = this;
	const properties = {};

	const tools = [].concat(
		data || [],
		JwtTool,
		AuthTool,
		BasicTool,
		StaticTool,
		StatusTool,
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

			let value;

			if (tool.method.constructor.name === 'AsyncFunction') {
				value = async function () {
					const r = await tool.method.apply(self, arguments);

					if (typeof r !== 'object') {
						throw new Error(`${tool.name} tool return type invalid`);
					}

					return r;
				}
			} else if (tool.method.constructor.name === 'Function') {
				value = function () {
					const r = tool.method.apply(self, arguments);

					if (typeof r !== 'object') {
						throw new Error(`${tool.name} tool return type invalid`);
					}

					return r;
				}
			} else {
				value = tool.method;
			}

			properties[name] = {
				enumerable: true,
				value: value
			};

		}

	}

	Object.defineProperty(self, 'tool', property);
	Object.defineProperties(self.tool, properties);
};
