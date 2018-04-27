'use strict';

module.exports = {
	name: 'redirect',
	method: async function (context, url) {
		return {
			code: 301,
			head: {
				'Location': url
			}
		};
	}
};
