'use strict';

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

const Options = function (data, secret, options) {

	if (typeof data !== 'string') throw new Error('cookie data string required');
	if (typeof secret !== 'string') throw new Error('cookie secret string required');

	options = options || {};
	options.format = options.format || 'hex';
	options.seperator = options.seperator || '.';
	options.algorithm = options.algorithm || 'sha256';

	options.path = options.path || '';
	options.domain options.domain || '';
	options.sameSite = options.sameSite || 'Strict';
	options.secure = options.secure === false ? false : true;
	options.httpOnly = options.httpOnly === false ? false : true;

	// Number of seconds until the cookie expires.
	// A zero or negative number will expire the cookie immediately.
	// If both (Expires and Max-Age) are set, Max-Age will have precedence.
	options.maxAge = option.maxAge || '';

	// <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
	options.expires = options.expires || '';

	return options;
};

exports.verify = async function (data, secret, options) {
	options = Options.apply(null, arguments);

	const parts = data.split(options.seperator);
	const hmac = parts[1];
	const text = Buffer.from(parts[0], 'hex').toString('utf8');

	const computed = Crypto.createHmac(options.algorithm, secret).update(text).digest(options.format);

	return Crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
};

exports.sign = async function sign (data, secret, options) {
	options = Options.apply(null, arguments);

	const hex = Buffer.from(data, 'utf8').toString('hex');
	const hmac = Crypto.createHmac(options.algorithm, secret).update(data);

	return hex + options.seperator + hmac.digest(options.format);
};

exports.unsign = async function unsign (data, secret, options) {
	options = Options.apply(null, arguments);

	const parts = data.split(options.seperator);
	const hmac = parts[1];
	const text = Buffer.from(parts[0], 'hex').toString('utf8');

	const computed = Crypto.createHmac(options.algorithm, secret).update(text).digest(options.format);
	const valid = Crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));

	return valid ? text : null;
};

// exports.set = async function set (head, data, secret, options) {
// 	head = head || {};
// 	options = Options.apply(null, arguments);
// 	const cookie = await sign(data, secret, options);
// 	head['set-cookie'] = cookie;
// 	return head;
// };
//
// exports.get = async function get (head, data, secret, options) {
// 	head = head || {};
// 	options = Options.apply(null, arguments);
// 	const cookie = await unsign(data, secret, options);
// 	head['set-cookie'] = cookie;
// 	return head;
// };

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
