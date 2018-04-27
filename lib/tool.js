'use strict';

const BasicTool = require('./tools/basic');
const StaticTool = require('./tools/static');
const RedirectTool = require('./tools/redirect');

module.exports = function Tool (data) {
	const self = this;
	const properties = {};
	const tools = [].concat(data || [], StaticTool, BasicTool, RedirectTool);

	const property = {
		value: {},
		enumerable: true
	};

	for (const tool of tools) {

		if (tool.name in properties) {
			throw new Error('duplicate tool');
		} else {

			properties[tool.name] = {
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
