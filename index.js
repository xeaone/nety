'use strict';

const Server = require('./lib/server');

const Servey = {};

Servey.servers = [];

Servey.create = function (options) {
	const server = new Server(options);

	Servey.servers.push({
		server: server,
		name: options.name
	});

	return server;
};

module.exports = Servey;
