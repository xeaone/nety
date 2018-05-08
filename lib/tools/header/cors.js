'use strict';

module.exports = {
	name: 'header-cors',
	method: async function (header) {
		const self = this;

		if (self.cors.constructor === Object) {
			header['access-control-allow-origin'] = self.cors.origin || '*';
			header['access-control-allow-methods'] = self.cors.methods || '*';
			header['access-control-allow-credentials'] = self.cors.credentials || 'true';
			header['access-control-request-method'] = self.cors.requestMethod || self.methodsString;
			header['access-control-allow-Headers'] = self.cors.headers || 'origin, x-requested-with, content-type, accept, range';
		} else if (self.cors === true) {
			header['access-control-allow-origin'] = '*';
			header['access-control-request-method'] = '*';
			header['access-control-allow-credentials'] = 'true';
			header['access-control-allow-methods'] = self.methodsString;
			header['access-control-allow-headers'] = 'origin, x-requested-with, content-type, accept, range';
		}

		return header;
	}
};
