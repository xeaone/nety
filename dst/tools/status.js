'use strict';

const Http = require('http');
const Messages = Http.STATUS_CODES;

module.exports = class Status {

    custom (code, message) {
        code = code || 200;
        message = message || Messages[code];
        return { code, message };
    }

    // 4xx
    badRequest (message) {
        return this.custom(400, message);
    }
    unauthorized (message) {
        return this.custom(401, message);
    }
    paymentRequired (message) {
        return this.custom(402, message);
    }
    forbidden (message) {
        return this.custom(403, message);
    }
    notFound (message) {
        return this.custom(404, message);
    }
    methodNotAllowed (message) {
        return this.custom(405, message);
    }
    notAcceptable (message) {
        return this.custom(406, message);
    }
    proxyAuthRequired (message) {
        return this.custom(407, message);
    }
    clientTimeout (message) {
        return this.custom(408, message);
    }
    conflict (message) {
        return this.custom(409, message);
    }
    resourceGone (message) {
        return this.custom(410, message);
    }
    lengthRequired (message) {
        return this.custom(411, message);
    }
    preconditionFailed (message) {
        return this.custom(412, message);
    }
    entityTooLarge (message) {
        return this.custom(413, message);
    }
    uriTooLong (message) {
        return this.custom(414, message);
    }
    unsupportedMediaType (message) {
        return this.custom(415, message);
    }
    rangeNotSatisfiable (message) {
        return this.custom(416, message);
    }
    expectationFailed (message) {
        return this.custom(417, message);
    }
    teapot (message) {
        return this.custom(418, message);
    }
    badData (message) {
        return this.custom(422, message);
    }
    locked (message) {
        return this.custom(423, message);
    }
    failedDependency (message) {
        return this.custom(424, message);
    }
    preconditionRequired (message) {
        return this.custom(428, message);
    }
    tooManyRequests (message) {
        return this.custom(429, message);
    }
    illegal (message) {
        return this.custom(451, message);
    }

    // 5xx
    badImplementation (message) {
        return this.custom(500, message);
    }
    notImplemented (message) {
        return this.custom(501, message);
    }
    badGateway (message) {
        return this.custom(502, message);
    }
    serverUnavailable (message) {
        return this.custom(503, message);
    }
    gatewayTimeout (message) {
        return this.custom(504, message);
    }

};
