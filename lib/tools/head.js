'use strict';

module.exports = class Head {

	constructor (options) {
		options = options || {};
	}

	async cache (context, header) {
		const self = this;

		if (typeof self.instance.cache === 'string') {
			header['cache-control'] = self.instance.cache;
		} else if (typeof self.instance.cache === 'number') {
			header['cache-control'] = `max-age=${self.instance.cache}`;
		} else if (typeof self.instance.cache === 'boolean') {
			header['cache-control'] = self.instance.cache ? 'max-age=3600' : 'no-cache';
		}

		return header;
	}

	async security (context, header) {
		const self = this;

		if (self.instance.cors) {
			if (self.instance.cors.constructor === Object) {
				header['access-control-max-age'] = self.instance.cors.age || 31536000;
				header['access-control-allow-origin'] = self.instance.cors.origin || self.instance.hostname;
				header['access-control-allow-credentials'] = self.instance.cors.credentials || 'true';
				header['access-control-expose-headers'] = self.instance.cors.expose || 'WWW-Authenticate, Server-Authorization';
				header['access-control-allow-headers'] = self.instance.cors.headers || 'Content-Type, Authorization, X-Frame-Options';
				header['access-control-allow-methods'] = self.instance.cors.methods || 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD';
			} else if (self.instance.cors === true) {
				header['access-control-max-age'] = 31536000;
				header['access-control-allow-origin'] = '*';
				header['access-control-allow-methods'] = '*';
				header['access-control-allow-credentials'] = 'true';
				header['access-control-expose-headers'] = 'WWW-Authenticate, Server-Authorization';
				header['access-control-allow-headers'] = 'Content-Type, Authorization, X-Frame-Options';
			}
		}

		if (self.instance.hsts) {
			if (self.instance.hsts === true) {
				header['strict-transport-security'] = 'max-age=15768000';
			} else if (typeof self.instance.hsts === 'number') {
				header['strict-transport-security'] = `max-age=${self.instance.hsts}`;
			} else {

				header['strict-transport-security'] = `max-age=${self.instance.hsts.maxAge || 15768000}`;

				if (self.instance.hsts.includeSubdomains || self.instance.hsts.includeSubDomains) {
					header['strict-transport-security'] = header['strict-transport-security'] + '; includeSubDomains';
				}

				if (self.instance.hsts.preload) {
					header['strict-transport-security'] = header['strict-transport-security'] + '; preload';
				}

			}
		}

		if (self.instance.xframe) {
			if (self.instance.xframe === true) {
				header['x-frame-options'] = 'SAMEORIGIN';
            } else if (self.instance.xframe === false) {
				header['x-frame-options'] = 'DENY';
			} else if (typeof self.instance.xframe === 'string') {
				header['x-frame-options'] = self.instance.xframe.toUpperCase();
            } else if (typeof self.instance.xframe.rule === 'string' && self.instance.xframe.rule.toLowerCase() === 'allow-from') {
				if (!self.instance.xframe.source) {
					header['x-frame-options'] = 'SAMEORIGIN';
				} else {
					header['x-frame-options'] = 'ALLOW-FROM ' + self.instance.xframe.source;
				}
			} else {
				header['x-frame-options'] = 'DENY';
			}
		}

		if (self.instance.xss) {
			if (self.instance.xss === true) {
				header['x-xss-protection'] = '1; mode=block';
			}
		}

		if (self.instance.xdownload) {
			if (self.instance.xdownload === true) {
				header['x-download-options'] = 'noopen';
			}
		}

		if (self.instance.xcontent) {
			if (self.instance.xcontent === true) {
				header['x-content-type-options'] = 'nosniff';
			}
		}

		// if (self.instance.referrer) {
		// 	header['referrer-policy'] = self.instance.referrer;
		// }

		return header;
	}

}
