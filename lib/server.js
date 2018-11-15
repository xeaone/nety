'use strict';

const Fs = require('fs');
const Url = require('url');
const Zlib = require('zlib');
const Path = require('path');
const Util = require('util');
const Http = require('http');
const Https = require('https');
const Events = require('events');
const Stream = require('stream');
const Buffer = require('buffer').Buffer;
const Querystring = require('querystring');

const Tool = require('./tool');
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
		Tool.call(this, options);
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
				response: response,
				message: self.debug ? error.message : 'internal server error'
			});
		}).catch(console.error);
	}

	async header (context) {
		const self = this;
		const header = {};

		header['content-type'] = `${self.contentType};${self.charset}`;

		const cache = await self.tool.head.cache(context, header);
		const security = await self.tool.head.security(context, header);

		return Object.assign(header, security, cache, context.head);
	}

	async router (context) {
		const routes = this.routes;
		const method = context.method;
		const path = context.url.pathname;

		for (let route of routes) {
			if (
				route.path === '*' ||
				route.path === path &&
				Utility.methodNormalize(route.method).includes(method)
			) {
				return route;
			}
		}

		return null;
	}

	async payloader (context) {
		const self = this;
		return new Promise(function (resolve, reject) {
			const chunks = [];

			context.request.on('error', reject);

			context.request.on('data', function (chunk) {
				if (chunks.byteLength > self.maxBytes) {
					context.request.connection.destroy();
					resolve(null);
				} else {
					chunks.push(chunk);
				}
			});

			context.request.on('end', function () {
				resolve(chunks);
			});

		});
	}

	async streamer (context) {
		return new Promise(function (resolve, reject) {
			const gzip = Zlib.createGzip();
			context.body.on('end', resolve);
			context.body.on('error', reject);
			context.body.pipe(gzip).pipe(context.response);
		});
	}

	async ender (context) {
		const self = this;

		context.head = await self.header(context);

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
			const charset = self.charset;
			context.head['content-encoding'] = `gzip`;
			context.head['content-type'] = `${mime};${charset}`;
			context.response.writeHead(context.code, context.head);
			return await self.streamer(context);
		}

		if (typeof context.body === 'object') {
			const mime = await Utility.getMime('json');
			const charset = self.charset;
			context.head['content-type'] = `${mime};${charset}`;
			context.body = JSON.stringify(context.body);
		}

		context.head['content-length'] = Buffer.byteLength(context.body);
		context.response.writeHead(context.code, context.head);
		context.response.end(context.body);
	}

	async handler (request, response) {
		const self = this;
		const url = Url.parse(request.url);
		const query = Querystring.parse(url.query);
		const method = Utility.methodNormalize(request.method);

		self.emit('request', request);

		const context = {
			url,
			query,
			method,
			request,
			response,
			head: {},
			body: null,
			code: null,
			options: {},
			instance: self,
			tool: self.tool,
			credential: null
		};

		const route = await self.router(context);

		context.options = Object.assign({}, {
			auth: self.auth,
			cors: self.cors,
			cache: self.cache
		}, route && route.options ? route.options : {});

		if (context.options.vhost) {
			let vhosts = [].concat(context.options.vhost);
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

			context = Object.assign(context, result);

			return await self.ender(context);
		}

		if (context.method.includes('OPTIONS')) {
			context.code = 200;
			return await self.ender(context);
		}

		if (!route) {
			context.code = 404;
			return await self.ender(context);
		}

		if (!route.handler) {
			context.code = 500;
			context.message = 'route handler required';
			return await self.ender(context);
		}

		if (typeof route.handler !== 'function') {
			context.code = 500;
			context.message = 'route handler requires function';
			return await self.ender(context);
		}

		if (context.options.auth) {
			const result = await self.tool.auth(context, context.options.auth);

			if (result.code !== 200) {
				context = Object.assign(context, result);
				return await self.ender(context);
			}

			context.credential = result.credential || {};
		}

		if (context.method.includes('POST')) {
			const result = await self.payloader(context);

			if (result === null) {
				context.code = 413;
				return await self.ender(context);
			}

			context.payload = result.toString();

			if (context.payload) {

				if (context.request.headers['content-type'].includes('application/json')) {
					context.payload = JSON.parse(context.payload);
				}

				if (context.request.headers['content-type'].includes('application/x-www-form-urlencoded')) {
					context.payload = Querystring.parse(context.payload);
				}

			}

		}

		if (self.event && self.event.handler) {
			if (typeof self.event.handler === 'function') {
				await self.event.handler(context);
			} else if (typeof self.event.handler.before === 'function') {
				await self.event.handler.before(context);
			}
		}

		const result = await route.handler(context);
		context = Object.assign(context, result);

		if (self.event && self.event.handler) {
			if (typeof self.event.handler === 'function') {
				await self.event.handler(context);
			} else if (typeof self.event.handler.after === 'function') {
				await self.event.handler.after(context);
			}
		}

		await self.ender(context);
	}

	async open () {
		const self = this;
		return new Promise(function (resolve) {
			const options = { port: self.port, host: self.hostname };
			self.listener.listen(options, function () {
				Object.assign(self.information, self.listener.address());
				self.emit('open');
				resolve();
			});
		});
	}

	async close () {
		const self = this;
		return new Promise(function (resolve) {
			self.listener.close(function () {
				self.emit('close');
				resolve();
			});
		});
	}

}
