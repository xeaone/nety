'use strict';

module.exports = class Basic {

	constructor (options) {
		options = options || {};
		this.format = options.format || 'base64';
		this.seperator = options.seperator || ':';
	}

	async strategy (context, credential, options) {
		const self = this;
		const format = options.format || self.format;
		const seperator = options.seperator || self.seperator;

		credential = Buffer.from(credential, format).toString();

		if (credential.indexOf(seperator) === -1) {
			return null;
		}

		const parts = credential.split(seperator);

		return { username: parts[0], password: parts[1] };
	}

}
