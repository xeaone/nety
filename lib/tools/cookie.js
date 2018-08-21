'use strict';

const Crypto = require('crypto');

exports.sign = async function sign (data, secret, options) {

	if (typeof data !== 'string') throw new Error('cookie data string required');
	if (typeof secret !== 'string') throw new Error('cookie secret string required');

	options = options || {};
	options.format = options.format || 'hex';
	options.seperator = options.seperator || '.';
	options.algorithm = options.algorithm || 'sha256';

	const hex = Buffer.from(data, 'utf8').toString('hex');
	const hmac = Crypto.createHmac(options.algorithm, secret).update(data);

	return hex + options.seperator + hmac.digest(options.format);
};

exports.unsign = async function unsign (data, secret, options) {

	if (typeof data !== 'string') throw new Error('cookie data string required');
	if (typeof secret !== 'string') throw new Error('cookie secret string required');

	options = options || {};
	options.format = options.format || 'hex';
	options.seperator = options.seperator || '.';
	options.algorithm = options.algorithm || 'sha256';

	const parts = data.split(options.seperator);
	const hmac = parts[1];
	const text = Buffer.from(parts[0], 'hex').toString('utf8');

	const computed = Crypto.createHmac(options.algorithm, secret).update(text).digest(options.format);
	const valid = Crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));

	return valid ? text : null;
};

(async function () {
	const m = await exports.sign('hello world', 'secret');
	const w = await exports.sign('hello world', 'secre');
	const r = await exports.unsign(w, 'secret');
	console.log(r);
}()).catch(console.error);
