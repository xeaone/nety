'use strict';

module.exports = {
	name: 'header-security',
	method: async function (header) {
		const self = this;

		if (self.hsts) {
			if (self.hsts === true) {
				header['strict-transport-security'] = 'max-age=15768000';
			} else if (typeof self.hsts === 'number') {
				header['strict-transport-security'] = 'max-age=' + self.hsts;
			} else {

				header['strict-transport-security'] = 'max-age=' + (self.hsts.maxAge || 15768000);

				if (self.hsts.includeSubdomains || self.hsts.includeSubDomains) {
					header['strict-transport-security'] = header['strict-transport-security'] + '; includeSubDomains';
				}

				if (self.hsts.preload) {
					header['strict-transport-security'] = header['strict-transport-security'] + '; preload';
				}

			}
		} else {
			header['strict-transport-security'] = 'max-age=15768000';
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
		} else {
			header['x-frame-options'] = 'DENY';
		}

		if (self.referrer) {
			header['referrer-policy'] = self.referrer;
		}

		header['x-download-options'] = 'noopen';
		header['x-xss-protection'] = '1; mode=block';
		header['x-content-type-options'] = 'nosniff';

		return header;
	}
};
