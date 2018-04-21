'use strict';

// const HttpsServer = require('./lib/server/https');
// const HttpServer = require('./lib/server/http');
const Server = require('./lib/server.js');

module.exports = {

	servers: [],

	create (options) {
		const server = new Server(options);

		this.servers.push({
			server: server,
			name: options.name
		});

		return server;
	}

};
