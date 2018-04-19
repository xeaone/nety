'use strict';

const Http = require('http');
const Server = require('./index');

const HttpServer = function (options) {
	Http.Server.call(this, this.setup);
	Server.call(this, options);
};

HttpServer.prototype = Object.create(Http.Server.prototype);

HttpServer.prototype.constructor = HttpServer;

HttpServer.prototype = Object.assign(HttpServer.prototype, Server.prototype);

module.exports = HttpServer;
