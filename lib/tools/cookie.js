'use strict';

const Uuidy = require('uuidy');
const Crypto = require('crypto');

module.exports = class Cookie {

	constructor (options) {
		options = options || {};

		this.name = options.name || 'sid';
		this.secret = options.secret || null;
		this.format = options.format || 'hex';
		this.seperator = options.seperator || '.';
		this.sessions = options.sessions || new Map();
		this.algorithm = options.algorithm || 'sha256';

		this.path = options.path || '';
		this.domain = options.domain || '';
		this.sameSite = options.sameSite || 'Strict';
		this.httpOnly = options.httpOnly === false ? false : true;
		this.secure = options.secure === undefined ? false : options.secure === true ? true : false;

		// Number of seconds until the cookie expires.
		// A zero or negative number will expire the cookie immediately.
		// If both (Expires and Max-Age) are set, Max-Age will have precedence.
		this.maxAge = options.maxAge || '';

		// <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
		this.expires = options.expires || '';
	}

	directive (data) {
		if (this.secure) data = `${data}; Secure`;
		if (this.httpOnly) data = `${data}; HttpOnly`;
		if (this.path) data = `${data}; Path=${this.path}`;
		if (this.domain) data = `${data}; Domain=${this.domain}`;
		if (this.maxAge) data = `${data}; Max-Age=${this.maxAge}`;
		if (this.expires) data = `${data}; Expires=${this.expires}`;
		if (this.sameSite) data = `${data}; SameSite=${this.sameSite}`;
		return `${this.name}=${data}`;
	}

	async parse (data) {
		if (!data) return null;

		const cookies = data.split(/\s*\;\s*/);

		for (const cookie of cookies) {
			const parts = cookie.split(/\s*\=\s*/);
			const name = parts[0];

			if (name !== this.name) continue;

			return decodeURI(parts[1]);
		}

		return null;
	}

	async strategy (context, encoded, options) {
		const sid = await this.unsign(encoded, options);
		const decoded = this.sessions.get(sid);

		if (!decoded) {
			return { valid: false, message: 'cookie session required' };
		}

		return { valid: true, credential: { decoded, encoded } };
	}

	async verify (data, options) {
		if (typeof data !== 'string') throw new Error('cookie data string required');

		options = options || {};

		const secret = options.secret || this.secret;

		if (!secret) throw new Error('cookie secret required');

		const parts = data.split(this.seperator);
		const hmac = parts[1];
		const text = Buffer.from(parts[0], 'hex').toString('utf8');

		const computed = Crypto.createHmac(this.algorithm, secret).update(text).digest(this.format);

		return Crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
	}

	async sign (data, options) {
		if (typeof data !== 'string') throw new Error('cookie data string required');

		options = options || {};

		const secret = options.secret || this.secret;

		if (!secret) throw new Error('cookie secret required');

		const hex = Buffer.from(data, 'utf8').toString('hex');
		const hmac = Crypto.createHmac(this.algorithm, secret).update(data);

		return hex + this.seperator + hmac.digest(this.format);
	}

	async unsign (data, options) {
		if (typeof data !== 'string') throw new Error('cookie data string required');

		options = options || {};

		const secret = options.secret || this.secret;

		if (!secret) throw new Error('cookie secret required');

		const parts = data.split(this.seperator);
		const hmac = parts[1];
		const text = Buffer.from(parts[0], 'hex').toString('utf8');

		const computed = Crypto.createHmac(this.algorithm, secret).update(text).digest(this.format);
		const valid = Crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));

		return valid ? text : null;
	}

	async create (data, options) {
		const sid = await Uuidy.four();
		const cookie = await this.sign(sid, options);

		data = data || {};
		data.sid = sid;
		this.sessions.set(sid, data);

		return cookie;
	}

	async set (context, data, secret) {
		if (!context) throw new Error('context required');

		const options = secret ? { secret } : undefined;
		const cookie = await this.create(data, options);

		context.head['set-cookie'] = this.directive(cookie);

		return cookie
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
