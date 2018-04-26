'use strict';

const Fs = require('fs');
const Url = require('url');
const Path = require('path');
const Util = require('util');
const Http = require('http');
const Https = require('https');
const Events = require('events');
const Stream = require('stream');
const Buffer = require('buffer').Buffer;

const Utility = require('./lib/utility');
const BasicPlugin = require('./plugins/basic');
const StaticPlugin = require('./plugins/static');

const MIMES = Utility.mimes;
const MESSAGES = Utility.messages;
const METHODS = Utility.methods.join(',');

module.exports = class Servey extends Events {

	constructor (options) {
		super();

		const self = this;

		options = options || {};

		self.plugin = {};
		self.port = options.port === undefined ? 0 : options.port;
		self.auth = options.auth === undefined ? null : options.auth;
		self.cors = options.cors === undefined ? false : options.cors;
		self.cache = options.cache === undefined ? true : options.cache;
		self.routes = options.routes === undefined ? [] : options.routes;
		self.host = options.host === undefined ? '0.0.0.0' : options.host;
		self.plugins = options.plugins === undefined ? [] : options.plugins;
		self.secure = options.secure === undefined ? null : options.secure;
		self.maxBytes = options.maxBytes === undefined ? 1e6 : options.maxBytes; // 1MB
		self.hostname = options.hostname === undefined ? 'localhost' : options.hostname;
		self.contentType = options.contentType === undefined ? 'txt' : options.contentType;

		self.plugins.push(StaticPlugin, BasicPlugin);

		for (let plugin of self.plugins) {
			if (plugin.name in self.plugin) {
				throw new Error('duplicate plugin');
			} else {
				self.plugin[plugin.name] = plugin.method;
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
				return self.ender(request, response, { code: 500 });
			}).catch(function (error) {
				throw error;
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

		if (self.cors && self.cors.constructor === Object) {
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

	async ender (request, response, data) {
		const self = this;
		const head = await self.createHead();

		data.head = data.head || {};
		data.head = Object.assign(head, data.head);

		if (!data.body) {
			data.body = {
				code: data.code,
				message: data.message || MESSAGES[data.code]
			};
		}

		if (data.body instanceof Stream.Readable) {

			const mime = await self.getMime(data.body.path);
			data.head['Content-Type'] = `${mime}; charset=utf8`;

			await self.streamer(request, response, data);

		} else {

			if (typeof data.body === 'object') {
				const mime = await self.getMime('json');
				data.head['Content-Type'] = `${mime}; charset=utf8`;
				data.body = JSON.stringify(data.body);
			}

			data.head['Content-Length'] = Buffer.byteLength(data.body);
			response.writeHead(data.code, data.head);
			response.write(data.body);
		}

		response.end();
	}

	async handler (request, response) {
		const self = this;

		self.emit('request', request, response);

		const url = Url.parse(request.url);
		const method = request.method;
		const path = url.pathname;

		const data = {
			head: {},
			body: null,
			code: null,
			credentials: null
		};

		if (path !== '/' && path.slice(-1) === '/') {
			data.code = 301;
			data.head['Location'] = `${path.slice(0, -1)}${url.search || ''}${url.hash || ''}`;
			return await self.ender(request, response, data);
		}

		if (self.auth) {

			if (!self.auth.name) {
				throw new Error('auth name required');
			}

			if (!self.auth.type) {
				throw new Error('auth type required');
			}

			if (!self.auth.validate) {
				throw new Error('auth validate required');
			}

			if (!(self.auth.name in self.plugin) ) {
				throw new Error('auth plugin required');
			}

			const result = await self.plugin[self.auth.name].call(self, request, response);

			if (result.code === 200) {
				data.credentials = result.credentials || {};
			} else {
				data.code = result.code;
				data.body = result.body;
				data.message = result.message;
				data.head['WWW-Authenticate'] = `${self.auth.type} realm="Secure"`;
				return await self.ender(request, response, data);
			}

		}

		const route = await self.getRoute(path, method);

		if (!route) {
			data.code = 404;
		} else if (!route.handler) {
			throw new Error('route handler required');
		} else if (typeof route.handler === 'function') {
			const result = await route.handler.call(self, request, response);
			data.body = result.body;
			data.message = result.message;
			data.code = result.code || 200;
		} else {
			throw new Error('route handler requires a string or function');
		}

		await self.ender(request, response, data);
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
