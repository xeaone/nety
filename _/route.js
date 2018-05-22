'use strict';

module.exports = function Route (data) {
	const self = this;
	const properties = {};
	const routes = data || [];

	const property = {
		value: [],
		enumerable: true
	};

	for (const route of routes) {

		if (typeof route !== 'object') {
			throw new Error('route type invalid');
		}

		if (!route.path) {
			throw new Error('route path required');
		}

		if (!route.method) {
			throw new Error('route method required');
		}

		if (!route.handler) {
			throw new Error('route handler required');
		}

		property.value.push(route);
	}

	Object.defineProperty(self, 'routes', {
		value: routes,
		enumerable: true
	});

};
