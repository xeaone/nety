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

const Tool = require('./tool');
const Route = require('./route');
const Option = require('./option');
const Utility = require('./utility');

module.exports = class Servey extends Events {

	constructor (options) {
		super();

		options = options || {};

		if (options.listener) {
			options.listener.on('request', this.callback.bind(this));
		} else if (options.secure) {
			options.listener = Https.createServer(options.secure, this.callback.bind(this));
		} else {
			options.listener = Http.createServer(this.callback.bind(this));
		}

		Option.call(this, options);
		Tool.call(this, options.tools);
		Route.call(this, options.routes);
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

	async header (data) {
		const self = this;
		const header = {};

		header['content-type'] = self.contentType;

		if (typeof self.cache === 'string') {
			header['cache-control'] = self.cache;
		} else if (typeof self.cache === 'number') {
			header['cache-control'] = `max-age=${self.cache}`;
		} else if (typeof self.cache === 'boolean') {
			header['cache-control'] = self.cache ? 'max-age=3600' : 'no-cache';
		}

		header = await self.tools.headerCors(header);
		header = await self.tools.headerSecurity(header);

		return Object.assign(header, data);
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

		context.head = await self.header(context.head);

		if (!context.code) {
			context.code = 200;
		}

		if (!context.body) {
			context.body = {
				code: context.code,
				message: context.message || self.messages[context.code]
			};
		}

		if (context.body instanceof Stream.Readable) {
			const mime = await Utility.getMime(context.body.path);
			context.head['content-type'] = `${mime}; charset=utf8`;
			context.response.writeHead(context.code, context.head);
			return await self.streamer(context);
		}

		if (typeof context.body === 'object') {
			const mime = await Utility.getMime('json');
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
			tool: self.tool,
			credentials: null,
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

			const result = await self.tool.redirect(context, location);

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

			if (!(auth.name in self.tool) ) {
				throw new Error('auth tool required');
			}

			context.head['www-authenticate'] = `${auth.type} realm="Secure"`;

			const result = await self.tool[auth.name](context, auth.validate);

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
				Object.assign(self.information, self.listener.address());
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
