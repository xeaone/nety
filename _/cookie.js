'use strict';

// async encode (body) {
// 	const data = JSON.stringify(body);
// 	return Buffer.from(data).toString('base64');
// },
// async decode (data) {
// 	const body = Buffer.from(data, 'base64').toString('utf8');
// 	return JSON.parse(body);
// }

module.exports = {
	name: 'cookie',
	value: async function (context, credential) {
		const body = Buffer.from(credential, 'base64').toString('utf8');
		const data = JSON.parse(body);
		return { valid: true, credential: data };
	}
};
