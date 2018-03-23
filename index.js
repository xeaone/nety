'use strict';

const HttpsServer = require('./lib/server/https');
const HttpServer = require('./lib/server/http');

module.exports = {

	servers: [],

	create (options) {
		let server;

		if (options.secure) {
			server = new HttpsServer(options);
		} else {
			server = new HttpServer(options);
		}

		this.servers.push({
			server: server,
			name: options.name
		});

		return server;
	}

};
