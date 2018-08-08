'use strict';

module.exports = {
	name: 'header-cache',
	value: async function (context, header) {
		const self = this;

		if (typeof self.cache === 'string') {
			header['cache-control'] = self.cache;
		} else if (typeof self.cache === 'number') {
			header['cache-control'] = `max-age=${self.cache}`;
		} else if (typeof self.cache === 'boolean') {
			header['cache-control'] = self.cache ? 'max-age=3600' : 'no-cache';
		}

		return header;
	}
};
