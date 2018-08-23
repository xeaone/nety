'use strict';

const Cookie = require('./plugins/cookie.js');

module.exports = function Plugin (options) {
	const self = this;

	options = options || {};

	const properties = {
		cookie: {
			value: new Cookie(self, options.cookie),
			enumerable: true
		},

	};

	Object.defineProperty(self, 'plugin', {
		value: {},
		enumerable: true
	});

	Object.defineProperties(self.tool, properties);
};
