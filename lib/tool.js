'use strict';

const Utility = require('./utility');
const JwtTool = require('./tools/jwt');
const AuthTool = require('./tools/auth');
const BasicTool = require('./tools/basic');
const StatusTool = require('./tools/status');
const StaticTool = require('./tools/static');
const RedirectTool = require('./tools/redirect');
const HeaderSecurityTool = require('./tools/header/security');

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
		RedirectTool,
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

			let value

			if (tool.method.constructor === 'AsyncFunction') {
				value = async function () {
					const r = await tool.method.apply(self, arguments);

					if (typeof r !== 'object') {
						throw new Error(`${tool.name} tool return type invalid`);
					}

					return r;
				}
			} else if (tool.method.constructor === 'Function') {
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
