'use strict';

const Utility = require('./utility');
const BasicTool = require('./tools/basic');
const StaticTool = require('./tools/static');
const RedirectTool = require('./tools/redirect');
const HeaderSecurityTool = require('./tools/header/security');

module.exports = function Tool (data) {
	const self = this;
	const properties = {};

	const tools = [].concat(
		data || [],
		BasicTool,
		StaticTool,
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

			properties[name] = {
				enumerable: true,
				value: async function () {
					const r = await tool.method.apply(self, arguments);

					if (typeof r !== 'object') {
						throw new Error(`${tool.name} tool return type invalid`);
					}

					return r;
				}
			};

		}

	}

	Object.defineProperty(self, 'tool', property);
	Object.defineProperties(self.tool, properties);
};
