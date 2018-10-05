'use strict';

const Utility = require('./utility.js');
const Head = require('./tools/head.js');
const Auth = require('./tools/auth.js');
const Basic = require('./tools/basic.js');
const Status = require('./tools/status.js');
const Static = require('./tools/static.js');
const Session = require('./tools/session.js');
const Redirect = require('./tools/redirect.js');

module.exports = function Tool (options) {
	const self = this;
	const properties = {};

	const tools = [].concat(
		Head,
		Auth,
		Basic,
		Static,
		Status,
		Session,
		Redirect,
		self.tools
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

		if (typeof tool === 'object') {
		// if (tool && tool.constructor === Object) {
			value = tool.value.bind(self);
		}

		if (typeof tool === 'function') {
		// if (tool && tool.constructor === Function) {
			value = new tool((options.tool || {})[name]);

			if (value.instance) throw new Error('reserved tool property instance');

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
