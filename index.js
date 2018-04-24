'use strict';

const Fs = require('fs');
const Url = require('url');
const Path = require('path');
const Util = require('util');
const Http = require('http');
const Https = require('https');
const Events = require('events');
const Stream = require('stream');

const Utility = require('./lib/utility');
const StaticPlugin = require('./plugins/static');

const MIMES = Utility.mimes;
const MESSAGES = Utility.messages;
const METHODS = Utility.methods.join(',');

const DEFAULTS = {
	port: 0,
	routes: [],
	plugins: [],
	plugin: {},
	cors: false,
	cache: true,
	secure: null,
	maxBytes: 1e6, // 1MB
	host: '0.0.0.0',
	contentType: 'txt',
	hostname: 'localhost'
};

module.exports = class Servey extends Events {

	constructor (options) {
		super();

		const self = this;

		options = options || {};

		Utility.merge(options, DEFAULTS);
		Object.assign(self, options);

		self.plugins = [ StaticPlugin ].concat(self.plugins);

		for (let plugin of self.plugins) {
			if (plugin.name in self.plugin) {
				throw new Error('duplicate plugin');
			} else {
				self.plugin[plugin.name] = plugin.handler;
			}
		}

		if (options.listener) {
			self.listener = options.listener;
		} else if (self.secure) {
			self.listener = Https.createServer(self.secure);
		} else {
			self.listener = Http.createServer();
		}

		self.listener.on('request', function (request, response) {
			Promise.resolve().then(function () {
				return self.handler(request, response);
			}).catch(function (error) {
				self.emit('error', error);
			});
		});

	}

	async createHead () {
		const self = this;
		const head = {};
		const contentType = MIMES[self.contentType];

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
			head['Access-Control-Allow-Methods'] = METHODS;
			head['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
		}

		return head;
	}

	async getMime (path) {
		const self = this;
		const data = path ? Path.extname(path) : self.contentType;
		const extension = data.charAt(0) === '.' ? data.slice(1) : data;
		return MIMES[extension || self.contentType];
	}

	async getRoute (path, method) {
		const routes = this.routes;

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

	async streamer (request, response, result) {
		return await new Promise(function (resolve, reject) {
			result.body.on('error', reject);

			result.body.on('open', function () {
				response.writeHead(result.code, result.head);
			});

			result.body.on('close', resolve);

			result.body.pipe(response);
		});
	}

	async ender (request, response, result) {
		const self = this;

		if (!result.body) {
			result.body = {
				code: result.code,
				message: result.message || MESSAGES[result.code]
			};
		}

		if (result.body instanceof Stream.Readable) {

			const mime = await self.getMime(result.body.path);
			result.head['Content-Type'] = `${mime}; charset=utf8`;

			await self.streamer(request, response, result);

		} else {

			if (typeof result.body === 'object') {
				const mime = await self.getMime('json');
				result.head['Content-Type'] = `${mime}; charset=utf8`;
				result.body = JSON.stringify(result.body);
			}

			result.head['Content-Length'] = Buffer.byteLength(result.body);
			response.writeHead(result.code, result.head);
			response.write(result.body);
		}

		response.end();
	}

	async handler (request, response) {
		const self = this;
		const result = {};

		self.emit('request', request, response);

		let url = Url.parse(request.url);
		let method = request.method;
		let path = url.pathname;

		result.head = await self.createHead();

		if (path !== '/' && path.slice(-1) === '/') {
			result.code = 301;
			result.head.Location = `${path.slice(0, -1)}${url.search || ''}${url.hash || ''}`;
		} else {
			const route = await self.getRoute(path, method);

			if (!route) {
				result.code = 404;
			} else if (!route.handler) {
				result.code = 500;
				const error = new Error('route handler required');
				self.emit('error', error);
			} else if (typeof route.handler === 'function') {

				const context = {
					url: url,
					path: path,
					method: method,
					plugin: self.plugin
				};

				const handle = await route.handler.call(context, request, response);

				result.body = handle.body;
				result.message = handle.message;
				result.code = handle.code || 200;

			} else {
				result.code = 500;
				const error = new Error('route handler requires a string or function');
				self.emit('error', error);
			}

		}

		await self.ender(request, response, result);
	}

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
	}

	async close () {
		const self = this;
		return await new Promise(function (resolve) {
			self.listener.close(function () {
				resolve();
				self.emit('close');
			});
		});
	}

}
