'use strict';

const Util = require('util');

module.exports = {
	name: 'jwt',
	method: async function (context, encoded, auth) {
		const self = this;

		if (!auth.secret) {
			return { valid: false, message: 'auth secret required' };
		}

		try {
			const Jwt = require('jsonwebtoken');
			const JwtVerify = Util.promisify(Jwt.verify);
			const decoded = await JwtVerify(encoded, auth.secret, auth.options);

			return { valid: true, credential: { decoded, encoded } };
		} catch (error) {
			if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
				return { valid: false, message: error.message };
			} else {
				throw error;
			}
		}

	}
};
