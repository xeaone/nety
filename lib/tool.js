'use strict';

const Utility = require('./utility.js');
const AuthTool = require('./tools/auth.js');
const StatusTool = require('./tools/status.js');
const StaticTool = require('./tools/static.js');
const RedirectTool = require('./tools/redirect.js');

const Head = require('./tools/head.js');
const Basic = require('./tools/basic.js');
const Cookie = require('./tools/cookie.js');

module.exports = function Tool (options) {
	const self = this;
	const properties = {};

	const tools = [].concat(
		self.tools,
		Head,
		Basic,
		Cookie,
		AuthTool,
		StatusTool,
		StaticTool,
		RedirectTool
	);

	for (const tool of tools) {
		let name;
		let value;

		if (!tool) {
			throw new Error('tool required');
		}

		name = Utility.toCamelCase(tool.name);

		if (!name) {
			throw new Error('tool name required');
		}

		if (name in properties) {
			throw new Error('tool name duplicate');
		}

		if (tool && tool.constructor === Object) {
			value = tool.value.bind(self);
		}

		if (tool && tool.constructor === Function) {
			value = new tool((options.tool || {})[name]);

			if (value.instance) throw new Error('tool reserved property instance');

			Object.defineProperty(value, 'instance', {
				value: self,
				enumerable: true
			});
		}

		properties[name] = {
			value: value,
			enumerable: true
		};
	}

	Object.defineProperty(self, 'tool', {
		value: {},
		enumerable: true
	});

	Object.defineProperties(self.tool, properties);
};
