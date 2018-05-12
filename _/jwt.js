'use strict';

const Util = require('util');
const Jwt = require('jsonwebtoken');

const JwtSign = Util.promisify(Jwt.sign);
const JwtVerify = Util.promisify(Jwt.verify);

module.exports = {

	sign: JwtSign,

	verify: async function (token, secret, options) {
		let error, data;

		try {
			data = await JwtVerify(token, secret, options);
		} catch (e) {
			error = e;
		}

		if (!error) {
			return { verified: true, data };
		} else if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
			return { verified: false, message: error.message, data };
		} else {
			throw error;
		}

	}

};
