'use strict';

const Util = require('util');
const Crypto = require('crypto');
const RandomBytes = Util.promisify(Crypto.randomBytes);

module.exports = class Session {

	constructor (options) {
		options = options || {};
		this.secret = options.secret || null;
		this.format = options.format || 'hex';
		this.seperator = options.seperator || '.';
		this.algorithm = options.algorithm || 'sha256';
		this.storage = options.storage || new Map();
	}

	async strategy (context, encoded, options) {
		const decoded = await this.unsign(encoded, options);

		if (!decoded) {
			return { valid: false, message: 'auth session authorization not found' };
		}

		return { valid: true, credential: { decoded, encoded } };
	}

	async verify (data, options) {
		if (typeof data !== 'string') throw new Error('auth session data string required');

		options = options || {};

		const secret = options.secret || this.secret;

		if (!secret) throw new Error('auth session secret required');

		const parts = data.split(this.seperator);
		const hmac = parts[1];
		const text = Buffer.from(parts[0], 'hex').toString('utf8');

		const computed = Crypto.createHmac(this.algorithm, secret).update(text).digest(this.format);

		return Crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
	}

	async sign (data, options) {
		if (typeof data !== 'string') throw new Error('auth session data string required');

		options = options || {};

		const secret = options.secret || this.secret;

		if (!secret) throw new Error('auth session secret required');

		const hex = Buffer.from(data, 'utf8').toString('hex');
		const hmac = Crypto.createHmac(this.algorithm, secret).update(data);

		return hex + this.seperator + hmac.digest(this.format);
	}

	async unsign (data, options) {
		if (typeof data !== 'string') throw new Error('auth session data string required');

		options = options || {};

		const secret = options.secret || this.secret;

		if (!secret) throw new Error('auth session secret required');

		const parts = data.split(this.seperator);
		const hmac = parts[1];
		const text = Buffer.from(parts[0], 'hex').toString('utf8');

		const computed = Crypto.createHmac(this.algorithm, secret).update(text).digest(this.format);
		const valid = Crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));

		return valid ? text : null;
	}

	async get (sid) {
		let result;

		if (!sid) throw new Error('auth session sid required');

		if (this.storage.constructor.name === 'AsyncFunction') {
			result = await this.storage.get(sid);
		} else {
			result = this.storage.get(sid);
		}

		return result;
	}

	async create (user, secret) {
		
		if (!user) throw new Error('auth session user required');
		if (!secret) throw new Error('auth session secret required');

		const bytes = await RandomBytes(16);
		const sid = bytes.toString('hex');
		const cookie = await this.sign(sid, { secret });

		if (typeof user === 'object') {
			user.sid = sid
		}

		if (this.storage.constructor.name === 'AsyncFunction') {
			await this.storage.set(sid, user);
		} else {
			this.storage.set(sid, user);
		}

		return cookie;
	}

}
