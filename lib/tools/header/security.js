'use strict';

module.exports = {
	name: 'header-security',
	method: async function (context, header) {
		const self = this;

		if (self.cors) {
			if (self.cors.constructor === Object) {
				header['access-control-max-age'] = self.cors.age || 31536000;
				header['access-control-allow-origin'] = self.cors.origin || self.hostname;
				header['access-control-allow-credentials'] = self.cors.credentials || 'true';
				header['access-control-expose-headers'] = self.cors.expose || 'WWW-Authenticate, Server-Authorization';
				header['access-control-allow-headers'] = self.cors.headers || 'Content-Type, Authorization, X-Frame-Options';
				header['access-control-allow-methods'] = self.cors.methods || 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD';
			} else if (self.cors === true) {
				header['access-control-max-age'] = 31536000;
				header['access-control-allow-origin'] = '*';
				header['access-control-allow-methods'] = '*';
				header['access-control-allow-credentials'] = 'true';
				header['access-control-expose-headers'] = 'WWW-Authenticate, Server-Authorization';
				header['access-control-allow-headers'] = 'Content-type, Authorization, X-Frame-Options';
			}
		}

		if (self.hsts) {
			if (self.hsts === true) {
				header['strict-transport-security'] = 'max-age=15768000';
			} else if (typeof self.hsts === 'number') {
				header['strict-transport-security'] = `max-age=${self.hsts}`;
			} else {

				header['strict-transport-security'] = `max-age=${self.hsts.maxAge || 15768000}`;

				if (self.hsts.includeSubdomains || self.hsts.includeSubDomains) {
					header['strict-transport-security'] = header['strict-transport-security'] + '; includeSubDomains';
				}

				if (self.hsts.preload) {
					header['strict-transport-security'] = header['strict-transport-security'] + '; preload';
				}

			}
		}

		if (self.xframe) {
			if (self.xframe === true) {
				header['x-frame-options'] = 'DENY';
			} else if (typeof self.xframe === 'string') {
				header['x-frame-options'] = self.xframe.toUpperCase();
			} else if (self.xframe.rule === 'allow-from') {
				if (!self.xframe.source) {
					header['x-frame-options'] = 'SAMEORIGIN';
				} else {
					header['x-frame-options'] = 'ALLOW-FROM ' + self.xframe.source;
				}
			} else {
				header['x-frame-options'] = self.xframe.rule.toUpperCase();
			}
		}

		if (self.xss) {
			if (self.xss === true) {
				header['x-xss-protection'] = '1; mode=block';
			}
		}

		if (self.xdownload) {
			if (self.xdownload === true) {
				header['x-download-options'] = 'noopen';
			}
		}

		if (self.xcontent) {
			if (self.xcontent === true) {
				header['x-content-type-options'] = 'nosniff';
			}
		}

		// if (self.referrer) {
		// 	header['referrer-policy'] = self.referrer;
		// }

		return header;
	}
};
