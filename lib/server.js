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
	secure: null,
	maxBytes: 1e6, // 1MB
	host: '0.0.0.0',
	contentType: 'txt',
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
				console.error(error);
				self.emit('error', error);
			});
		});

	}

	async getContentTypeByExtension (path) {
		const self = this;
		const data = path ? Path.extname(path) : self.contentType;
		const extension = data.charAt(0) === '.' ? data.slice(1) : data;
		const contentType = self.mimes[extension || self.contentType];
		return contentType;
	}

	async createHead (request) {
		const self = this;
		const head = {};
		const path = request.url;
		const contentType = self.mimes[self.contentType];

		head['Content-Type'] = `${contentType}; charset=utf8`;

		if (typeof self.cache === 'string') {
			head['Cache-Control'] = self.cache;
		} else if (typeof self.cache === 'number') {
			head['Cache-Control'] = `max-age=${self.cache}`;
		} else if (typeof self.cache === 'boolean') {
			head['Cache-Control'] = self.cache ? 'max-age=3600' : 'no-cache';
		}

		if (self.cors.constructor === Object) {
			head['Access-Control-Allow-Origin'] = self.cors.origin;
			head['Access-Control-Allow-Methods'] = self.cors.methods;
			head['Access-Control-Allow-Headers'] = self.cors.headers;
			head['Access-Control-Request-Method'] = self.cors.requestMethod;
			head['Access-Control-Allow-Credentials'] = self.cors.credentials;
		} else if (self.cors === true) {
			head['Access-Control-Allow-Origin'] = '*';
			head['Access-Control-Request-Method'] = '*';
			head['Access-Control-Allow-Credentials'] = true;
			head['Access-Control-Allow-Methods'] = HTTP_METHODS;
			head['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
		}

		return head;
	}

	async getRoute (request) {
		const path = request.url;
		const routes = this.routes;
		const method = request.method;

		for (let route of routes) {
			if (
				route.path === '*' ||
				route.path === path &&
				route.method.toUpperCase() === method
			) {
				return route;
			}
		}

		return null;
	}

	async getData (request) {
		return await new Promise(function (resolve, reject) {
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
		const head = await self.createHead(request);
		const route = await self.getRoute(request);

		let result;
		let code = 200;

		if (!route) {
			route = Utility.statusString(404);
			response.writeHead(404, head);
			response.end(route);
			self.emit('request', request, response);
			return;
		}

		if (!route.handler) {
			throw new Error('route handler required');
		} if (typeof route.handler === 'string') {

			const stat = await Stat({
				spa: self.spa,
				file: self.file,
				url: request.url,
				folder: route.handler
			});

			if (stat.path) {
				code = stat.code;
				result = Fs.createReadStream(stat.path);
			} else {
				console.log('not stat.path');
			}

		} else if (typeof route.handler === 'function') {
			result = await route.handler(request, response);
		} else {
			throw new Error('route handler requires a string or function');
		}

		if (result instanceof Stream.Readable) {
			const contentType = await self.getContentTypeByExtension(result.path);

			head['Content-Type'] = `${contentType}; charset=utf8`;

			result.on('error', function (error) {
				const status = Utility.statusString(500);
				response.writeHead(500, head);
				response.end(status);
				self.emit('error', error);
			});

			result.on('open', function () {
				response.writeHead(code, head);
			});

			result.on('close', function () {
				response.end();
				self.emit('request', request, response);
			});

			result.pipe(response);

			return;
		}

		if (typeof result === 'object') {
			const contentType = await self.getContentTypeByExtension('json');
			head['Content-Type'] = `${contentType}; charset=utf8`;
			result = JSON.stringify(result);
		}

		response.writeHead(200, head);
		response.end(result);
		self.emit('request', request, response);

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
		// 	const header = Utility.createHead(data);
		// 	const status = Utility.statusString(500);
		//
		// 	response.writeHead(500, header);
		// 	response.end(status);
		//
		// 	self.emit('error', error);
		// });

	};

	async open () {
		const self = this;
		return await new Promise(function (resolve) {
			const data = { port: self.port, host: self.host };
			self.listener.listen(data, function () {
				const address = self.listener.address();

				self.port = address.port;
				self.host = address.host;

				resolve();
				self.emit('open');
			});
		});
	};

	async close () {
		const self = this;
		return await new Promise(function (resolve) {
			self.listener.close(function () {
				resolve();
				self.emit('close');
			});
		});
	};

}
