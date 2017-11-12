'use strict';

const HttpsServer = require('./lib/server/https');
const HttpServer = require('./lib/server/http');

const Servey = {};

Servey.servers = [];

Servey.create = function (options) {
	let server;

	if (options.secure) {
		server = new HttpsServer(options);
	} else {
		server = new HttpServer(options);
	}

	Servey.servers.push({
		server: server,
		name: options.name
	});

	return server;
};

module.exports = Servey;
