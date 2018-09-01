'use strict';

module.exports = class Basic {

	constructor (options) {
		options = options || {};
		this.format = options.format || 'base64';
		this.seperator = options.seperator || ':';
	}

	async strategy (context, encoded, options) {
		const self = this;
		const format = options.format || self.format;
		const seperator = options.seperator || self.seperator;

		const credential = Buffer.from(encoded, format).toString();

		if (credential.indexOf(seperator) === -1) {
			return { valid: false, message: 'auth basic invalid authorization format' };
		}

		const parts = credential.split(seperator);
		const decoded = { username: parts[0], password: parts[1] };

		return { valid: true, credential: { decoded, encoded } };
	}

}
