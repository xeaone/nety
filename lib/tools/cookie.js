'use strict';

const Uuidy = require('uuidy');
const Crypto = require('crypto');

const Directives = function (data, options) {
	if (options.secure) data = `${data}; Secure`;
	if (options.httpOnly) data = `${data}; HttpOnly`;
	if (options.path) data = `${data}; ${options.path}`;
	if (options.domain) data = `${data}; ${options.domain}`;
	if (options.maxAge) data = `${data}; ${options.maxAge}`;
	if (options.expires) data = `${data}; ${options.expires}`;
	if (options.sameSite) data = `${data}; ${options.sameSite}`;
	return `token=${data}`;
};

module.exports = class Cookie {

	constructor (instance, options) {
		options = options || {};

		this.instance = instance;

		this.secret = options.secret || null;
		this.format = options.format || 'hex';
		this.seperator = options.seperator || '.';
		this.sessions = options.sessions || new Map();
		this.algorithm = options.algorithm || 'sha256';

		this.path = options.path || '';
		this.domain = options.domain || '';
		this.sameSite = options.sameSite || 'Strict';
		this.secure = options.secure === false ? false : true;
		this.httpOnly = options.httpOnly === false ? false : true;

		// Number of seconds until the cookie expires.
		// A zero or negative number will expire the cookie immediately.
		// If both (Expires and Max-Age) are set, Max-Age will have precedence.
		this.maxAge = options.maxAge || '';

		// <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
		this.expires = options.expires || '';
	}

	async parse (context) {
		const data = context.request.header['Cookie'] || context.request.header['cookie'];
		const cookies = data.split(/\s*\;\s*/);

		for (const cookie of cookies) {
			const parts = cookie.split(/\s*\=\s*/);
			const name = parts[0];
			if (name !== 'sid') continue;
			return decodeURI(parts[1]);
		}

		return null;
	}

	async strategy (context, encoded, options) {
		const self = this;
		const sid = await self.unsign(encoded);

		const decoded = self.sessions.get(sid);

		if (!decoded) {
			return { valid: false };
		}

		return { valid: true, credential: { decoded, encoded } };
	}

	async verify (data) {
		if (typeof data !== 'string') throw new Error('cookie data string required');

		const parts = data.split(this.seperator);
		const hmac = parts[1];
		const text = Buffer.from(parts[0], 'hex').toString('utf8');

		const computed = Crypto.createHmac(this.algorithm, secret).update(text).digest(this.format);

		return Crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
	}

	async sign (data) {
		const hex = Buffer.from(data, 'utf8').toString('hex');
		const hmac = Crypto.createHmac(this.algorithm, secret).update(data);

		return hex + this.seperator + hmac.digest(this.format);
	}

	async unsign (data) {
		const parts = data.split(this.seperator);
		const hmac = parts[1];
		const text = Buffer.from(parts[0], 'hex').toString('utf8');

		const computed = Crypto.createHmac(this.algorithm, secret).update(text).digest(this.format);
		const valid = Crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));

		return valid ? text : null;
	}

	async set (context, data) {
		if (!context) throw new Error('context required');
		const sid = Uuidy.four();
		const cookie = await this.sign(sid);
		data = data || {};
		data.sid = sid;
		this.sessions.set(sid, data);
		return Directive(cookie);
	}

}

// (async function () {
// 	const m = await exports.sign('hello world', 'secret');
// 	const r = await exports.unsign(m, 'secret');
//
// 	console.log(r);
//
// 	const shouldBeFalse = await exports.verify(m, 'wrong-secret');
// 	console.log('verify:', shouldBeFalse);
//
// }()).catch(console.error);
