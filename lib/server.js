'use strict';

const Os = require('os');
const Fs = require('fs');
const Url = require('url');
const Path = require('path');
const Util = require('util');
const Http = require('http');
const Https = require('https');
const Events = require('events');
const Stream = require('stream');
const Buffer = require('buffer').Buffer;

const Utility = require('./utility');
const BasicPlugin = require('./plugins/basic');
const StaticPlugin = require('./plugins/static');
const RedirectPlugin = require('./plugins/redirect');

const MIMES = Utility.mimes;
const MESSAGES = Utility.messages;
const METHODS = Utility.methods.join(',');
const HOSTNAME = Os.hostname() || 'localhost';

module.exports = class Servey extends Events {

	constructor (options) {
		super();

		const self = this;

		options = options || {};

		self.plugin = {};
		self.information = {};

		self.port = options.port === undefined ? 0 : options.port;
		self.auth = options.auth === undefined ? null : options.auth;
		self.cors = options.cors === undefined ? false : options.cors;
		self.cache = options.cache === undefined ? true : options.cache;
		self.routes = options.routes === undefined ? [] : options.routes;
		self.plugins = options.plugins === undefined ? [] : options.plugins;
		self.secure = options.secure === undefined ? null : options.secure;
		self.maxBytes = options.maxBytes === undefined ? 1e6 : options.maxBytes; // 1MB
		self.hostname = options.hostname === undefined ? HOSTNAME : options.hostname;

		self.mime = options.mime === undefined ? MIMES['txt'] : options.mime;
		self.charset = options.charset === undefined ? 'utf8' : options.charset;
		self.contentType = options.contentType === undefined ? `${self.mime}; charset=${self.charset}` : options.contentType;

		self.plugins.push(StaticPlugin, BasicPlugin, RedirectPlugin);

		for (let plugin of self.plugins) {
			if (plugin.name in self.plugin) {
				throw new Error('duplicate plugin');
			} else {
				self.plugin[plugin.name] = async function () {
					const result = await plugin.method.apply(this, arguments);
					if (typeof result !== 'object') {
						throw new Error(`${plugin.name} plugin result type invalid`);
					}
					return result;
				}
			}
		}

		if (options.listener) {
			self.listener = options.listener;
		} else if (self.secure) {
			self.listener = Https.createServer(self.secure);
		} else {
			self.listener = Http.createServer();
		}

		self.listener.on('request', self.callback.bind(self));
	}

	callback (request, response) {
		const self = this;
		Promise.resolve().then(function () {
			return self.handler(request, response);
		}).catch(function (error) {
			self.emit('error', error);
			return self.ender({
				code: 500,
				request: request,
				response: response
			});
		});
	}

	async createHead (data) {
		const self = this;
		const head = {};

		head['content-type'] = self.contentType;

		if (typeof self.cache === 'string') {
			head['cache-control'] = self.cache;
		} else if (typeof self.cache === 'number') {
			head['cache-control'] = `max-age=${self.cache}`;
		} else if (typeof self.cache === 'boolean') {
			head['cache-control'] = self.cache ? 'max-age=3600' : 'no-cache';
		}

		if (self.cors.constructor === Object) {
			head['access-control-allow-origin'] = self.cors.origin || '*';
			head['access-control-allow-methods'] = self.cors.methods || '*';
			head['access-control-request-method'] = self.cors.requestMethod || METHODS;
			head['access-control-allow-credentials'] = self.cors.credentials || 'true';
			head['access-control-allow-Headers'] = self.cors.headers || 'origin, x-requested-with, content-type, accept, range';
		} else if (self.cors === true) {
			head['access-control-allow-origin'] = '*';
			head['access-control-request-method'] = '*';
			head['access-control-allow-methods'] = METHODS;
			head['access-control-allow-credentials'] = 'true';
			head['access-control-allow-headers'] = 'origin, x-requested-with, content-type, accept, range';
		}

		return Object.assign(head, data);
	}

	async getMime (path) {
		const self = this;
		const data = path ? Path.extname(path) : self.contentType;
		const extension = data.charAt(0) === '.' ? data.slice(1) : data;
		return extension ? MIMES[extension] : self.mime;
	}

	async router (context) {
		const routes = this.routes;
		const method = context.method;
		const path = context.url.pathname;

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

	async uploader (context) {
		const self = this;
		return new Promise(function (resolve, reject) {
			let data = '';

			context.request.on('error', reject);

			context.request.on('data', function (chunk) {
	            if (data.length > self.maxBytes) {
					context.request.connection.destroy();
					// TODO responed with closed connection
				} else {
					data += chunk;
				}
	        });

	        context.request.on('end', function () {
				resolve(data.toString());
	        });

		});
	}

	async streamer (context) {
		return new Promise(function (resolve, reject) {
			context.body.on('end', resolve);
			context.body.on('error', reject);
			context.body.pipe(context.response);
		});
	}

	async ender (context) {
		const self = this;

		context.head = await self.createHead(context.head);

		if (!context.code) {
			context.code = 200;
		}

		if (!context.body) {
			context.body = {
				code: context.code,
				message: context.message || MESSAGES[context.code]
			};
		}

		if (context.body instanceof Stream.Readable) {
			const mime = await self.getMime(context.body.path);
			context.head['content-type'] = `${mime}; charset=utf8`;
			context.response.writeHead(context.code, context.head);
			return await self.streamer(context);
		}

		if (typeof context.body === 'object') {
			const mime = await self.getMime('json');
			context.head['content-type'] = `${mime}; charset=utf8`;
			context.body = JSON.stringify(context.body);
		}

		context.head['content-length'] = Buffer.byteLength(context.body);
		context.response.writeHead(context.code, context.head);
		context.response.end(context.body);
	}

	async handler (request, response) {
		const self = this;

		self.emit('request', request);

		let context = {
			request,
			response,
			head: {},
			body: null,
			code: null,
			instance: self,
			credentials: null,
			plugin: self.plugin,
			method: request.method,
			url: Url.parse(request.url)
		};

		const route = await self.router(context);
		const routeOptions = route && route.options ? route.options : {};

		const serverOptions = {
			auth: self.auth,
			cors: self.cors,
			cache: self.cache
		};

		const options = Object.assign({}, serverOptions, routeOptions);

		if (options.vhost) {
			let vhosts = [].concat(options.vhost);
			let hostname = request.headers.host;

			if (!vhosts.includes(hostname)) {
				context.code = 404;
				return await self.ender(context);
			}

		}

		if (context.url.pathname !== '/' && context.url.pathname.slice(-1) === '/') {
			const pathname = context.url.pathname.replace(/\/+/, '/').slice(0, -1) || '/';
			const location = `${pathname}${context.url.search || ''}${context.url.hash || ''}`;

			const result = await self.plugin.redirect(context, location);

			Object.assign(context, result);

			return await self.ender(context);
		}

		if (!route) {
			context.code = 404;
			return await self.ender(context);
		}

		if (!route.handler) {
			throw new Error('route handler required');
		}

		if (typeof route.handler !== 'function') {
			throw new Error('route handler requires a string or function');
		}

		if (
			(route.options && route.options.auth) ||
			(self.auth && !route.options || route.options.auth !== false)
		) {
			const auth = route.options && typeof route.options.auth === 'object' ? route.options.auth : self.auth;

			if (typeof auth !== 'object') {
				throw new Error('auth type invalid');
			}

			if (!auth.name) {
				throw new Error('auth name required');
			}

			if (!auth.type) {
				throw new Error('auth type required');
			}

			if (!auth.validate) {
				throw new Error('auth validate required');
			}

			if (!(auth.name in self.plugin) ) {
				throw new Error('auth plugin required');
			}

			context.head['www-authenticate'] = `${auth.type} realm="Secure"`;

			const result = await self.plugin[auth.name](context, auth.validate);

			if (result.code !== 200) {
				Object.assign(context, result);

				return await self.ender(context);
			}

			context.credentials = result.credentials || {};
		}

		const result = await route.handler(context);

		Object.assign(context, result);

		await self.ender(context);
	}

	async open () {
		const self = this;
		return new Promise(function (resolve) {
			const options = { port: self.port, host: self.hostname };
			self.listener.listen(options, function () {
				self.information = self.listener.address();
				resolve();
				self.emit('open');
			});
		});
	}

	async close () {
		const self = this;
		return new Promise(function (resolve) {
			self.listener.close(function () {
				resolve();
				self.emit('close');
			});
		});
	}

}
