'use strict';

const Fs = require('fs');
const Path = require('path');
const Util = require('util');
const Http = require('http');
const Https = require('https');
const Events = require('events');
const Stream = require('stream');

const Stat = require('./stat');
const Utility = require('./utility');

const MIMES = require('./mimes');
const HTTP_METHODS = Http.METHODS.join(',');

const DEFAULTS = {
	port: 0,
	routes: [],
	spa: false,
	cors: false,
	cache: true,
	mimes: MIMES,
	secure: false,
	maxBytes: 1e6, // 1MB
	host: '0.0.0.0',
	file: 'index.html',
	hostname: 'localhost',
	folder: Path.resolve('public')
};

module.exports = class Server extends Events {

	constructor (options) {
		super();

		const self = this;

		options = options || {};

		Utility.merge(options, DEFAULTS);
		Object.assign(self, options);

		if (options.listener) {
			self.listener = options.listener;
		} else if (self.secure) {
			self.listener = Https.createServer(self.secure);
		} else {
			self.listener = Http.createServer();
		}

		self.listener.on('request', function (request, response) {
			Promise.resolve().then(function () {
				return self.handler.call(self, request, response);
			}).catch(function (error) {
				self.emit('error', error);
				console.error(error);
			});
		});

	}

	createHeader (request) {
		const self = this;
		const header = {};
		const path = request.url;
		const extention = Path.extname(path).slice(1) || 'default';
		const contentType = self.mimes[extention];

		header['Content-Type'] = `${contentType}; charset=utf8`;

		if (typeof self.cache === 'string') {
			header['Cache-Control'] = self.cache;
		} else if (typeof self.cache === 'number') {
			header['Cache-Control'] = `max-age=${self.cache}`;
		} else if (typeof self.cache === 'boolean') {
			header['Cache-Control'] = self.cache ? 'max-age=3600' : 'no-cache';
		}

		if (self.cors.constructor === Object) {
			header['Access-Control-Allow-Origin'] = self.cors.origin;
			header['Access-Control-Allow-Methods'] = self.cors.methods;
			header['Access-Control-Allow-Headers'] = self.cors.headers;
			header['Access-Control-Request-Method'] = self.cors.requestMethod;
			header['Access-Control-Allow-Credentials'] = self.cors.credentials;
		} else if (self.cors === true) {
			header['Access-Control-Allow-Origin'] = '*';
			header['Access-Control-Request-Method'] = '*';
			header['Access-Control-Allow-Credentials'] = true;
			header['Access-Control-Allow-Methods'] = HTTP_METHODS;
			header['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
		}

		return header;
	}

	async getRoute (request) {
		const path = request.url;
		const routes = this.routes;
		const method = request.method;

		for (let route of routes) {
			if (route.path === path && route.method.toUpperCase() === method) {
				return route;
			}
		}

		return null;
	}

	getData (request) {
		return new Promise(function (resolve, reject) {
			let data = '';

			request.on('data', function (chunk) {
	            if (data.length > this.maxBytes) {
					request.connection.destroy();
				} else {
					data += chunk;
				}
	        });

	        request.on('end', function () {
				resolve(data.toString());
	        });

		});
	}

	async handler (request, response) {
		const self = this;
		const header = self.createHeader(request);
		const route = await self.getRoute(request);

		if (!route) {
			const status = Utility.statusString(404);
			console.log(header);
			response.writeHead(404, header);
			console.log(status);
			response.end(status);
		} else {
			const result = await route.handler(request, response);

			if (result && result.constructor === Stream.Readable) {

				result.on('error', function (error) {
					const status = Utility.statusString(500);
					response.writeHead(500, header);
					response.end(status);
					self.emit('error', error);
				});

				result.on('open', function () {
					response.writeHead(200, header);
				});

				result.on('close', function () {
					response.end();
					self.emit('request', request);
				});

				result.pipe(response);
			} else {
				response.writeHead(200, header);
				response.end(result);
				self.emit('request', request);
			}

		}

		// const data = {
		// 	path: '/',
		// 	code: 200,
		// 	cors: this.cors,
		// 	cache: this.cache
		// };
		//
		// Promise.resolve().then(function () {
		// 	return Stat({
		// 		spa: self.spa,
		// 		file: self.file,
		// 		url: request.url,
		// 		folder: self.folder
		// 	});
		// }).then(function (stat) {
		// 	data.path = stat.path || data.path;
		// 	data.code = stat.code || data.code;
		//
		// 	return self.request(request, response, data);
		// }).catch(function (error) {
		// 	const header = Utility.createHeader(data);
		// 	const status = Utility.statusString(500);
		//
		// 	response.writeHead(500, header);
		// 	response.end(status);
		//
		// 	self.emit('error', error);
		// });

	};

	async request (request, response, data) {
		const self = this;
		const header = Utility.createHeader(data);

		if (data.code === 200) {
			const stream = Fs.createReadStream(data.path);

			stream.on('error', function (error) {
				const status = Utility.statusString(500);

				response.writeHead(500, header);
				response.end(status);

				self.emit('error', error);
			});

			stream.on('open', function () {
				response.writeHead(200, header);
			});

			stream.on('close', function () {
				response.end();
			});

			stream.pipe(response);
		} else {

			if (data.code === 301 || data.code === 302) {
				header.Location = data.path;
			}

			const status = Utility.statusString(data.code);

			response.writeHead(data.code, header);
			response.end(status);
		}

		self.emit('request', request);

	};

	open () {
		const self = this;
		return new Promise(function (resolve, reject) {
			self.listener.listen({ port: self.port, host: self.host }, function () {
				const address = self.listener.address();

				self.port = address.port;
				self.host = address.host;

				resolve();
				self.emit('open');
			});
		});
	};

	close () {
		const self = this;
		return new Promise(function (resolve, reject) {
			self.listener.close(function () {
				resolve();
				self.emit('close');
			});
		});
	};

}
