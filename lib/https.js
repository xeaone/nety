'use strict';

const Https = require('http');
const Server = require('./server');

const HttpsServer = function (options) {
	Https.Server.call(this, this.setup);
	Server.call(this, options);
};

HttpsServer.prototype = Object.create(Https.Server.prototype);

HttpsServer.prototype.constructor = HttpsServer;

HttpsServer.prototype = Object.assign(HttpsServer.prototype, Server.prototype);

module.exports = HttpsServer;
