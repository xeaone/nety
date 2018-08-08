
module.exports = {
	name: 'cookie',
	value: {
		async encode (body) {
			const data = JSON.stringify(body);
			return Buffer.from(data).toString('base64');
		},
		async decode (data) {
			const body = Buffer.from(data, 'base64').toString('utf8');
			return JSON.parse(body);
		}
		// async set (data) {
		// 	const self = this;
		// 	console.log(self.context);
		// },
		// async clear () {
		//
		// }
	}
};
