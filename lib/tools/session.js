'use strict';

module.exports = {
	name: 'session',
	strategy: async function (context, credential, auth) {
		const self = this;

		credential = Buffer.from(credential, 'base64');

		if (credential.byteLength >= 4096) {
			throw new Error('max cookie byte length');
		}

		if (auth.secret) {
			// TODO: do encryption
		}

		credential = credential.toString();
		credential = JSON.parse(credential);

		if (!(credential.sid in context.tool.session)) {
			return { valid: false };
		}

		return { valid: true, credential };
	}
};
