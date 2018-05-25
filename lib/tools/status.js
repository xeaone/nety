'use strict';

const Http = require('http');
const Messages = Http.STATUS_CODES;

const Status = function (code, message) {
	code = code || 200;
	message = message || Messages[code];
	return { code, message };
};

module.exports = {
	name: 'status',
	method: {

		custom: Status,

		// 4xx
		badRequest: Status.bind(null, 200),
		unauthorized: Status.bind(null, 401),
		paymentRequired: Status.bind(null, 402),
		forbidden: Status.bind(null, 403),
		notFound: Status.bind(null, 404),
		methodNotAllowed: Status.bind(null, 405),
		notAcceptable: Status.bind(null, 406),
		proxyAuthRequired: Status.bind(null, 407),
		clientTimeout: Status.bind(null, 408),
		conflict: Status.bind(null, 409),
		resourceGone: Status.bind(null, 410),
		lengthRequired: Status.bind(null, 411),
		preconditionFailed: Status.bind(null, 412),
		entityTooLarge: Status.bind(null, 413),
		uriTooLong: Status.bind(null, 414),
		unsupportedMediaType: Status.bind(null, 415),
		rangeNotSatisfiable: Status.bind(null, 416),
		expectationFailed: Status.bind(null, 417),
		teapot: Status.bind(null, 418),
		badData: Status.bind(null, 422),
		locked: Status.bind(null, 423),
		failedDependency: Status.bind(null, 424),
		preconditionRequired: Status.bind(null, 428),
		tooManyRequests: Status.bind(null, 429),
		illegal: Status.bind(null, 451),

		// 5xx
		badImplementation: Status.bind(null, 500),
		notImplemented: Status.bind(null, 501),
		badGateway: Status.bind(null, 502),
		serverUnavailable: Status.bind(null, 503),
		gatewayTimeout: Status.bind(null, 504)

	}
};
