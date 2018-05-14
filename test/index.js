
const Servey = require('../lib/server');
const Path = require('path');
const Fs = require('fs');
const Url = require('url');
const Jwt = require('jsonwebtoken');
const Util = require('util');

const JwtSign = Util.promisify(Jwt.sign);

(async function () {

	const routes = [
		{
			path: '/token',
			method: 'get',
			options: {
				auth: false
			},
			handler: async function (context) {
				const token = await JwtSign({ email: 'test@mail.com' }, 'secret');
				return {
					body: token
				};
			}
		},
		{
			path: '/credential',
			method: 'get',
			options: {
				auth: {
					strategy: 'jwt',
					secret: 'secret',
					location: 'query',
					validate: async function (context, credential) {
						if (credential.email === 'test@mail.com') {
							return { valid: true, credential };
						} else {
							return { valid: false, credential };
						}
					}
				}
			},
			handler: async function (context) {
				return {
					body: context.credential
				};
			}
		},
		{
			path: '/private',
			method: 'get',
			options: {
				auth: {
					type: 'basic',
					strategy: 'basic',
					validate: async function (context, data) {
						if (data.username === 'loo' && data.password === 'bar') {
							return { valid: true, credential: { username: 'loo'} };
						} else {
							return { valid: false };
						}
					}
				}
			},
			handler: async function (context) {
				return {
					body: 'private'
				};
			}
		},
		{
			path: '/public',
			method: 'get',
			options: {
				auth: false
			},
			handler: async function (context) {
				return {
					body: 'public'
				};
			}
		},
		{
			path: '*',
			method: 'get',
			options: {
				vhost: ['localhost:8080', 'testcom.localhost:8080'],
			},
			handler: async function (context) {
				return await context.tool.static({
					spa: true,
					folder: './test/static',
					path: context.url.pathname
				});
			}
		}
	];

	const server = new Servey({
		cache: false,
		hostname: 'localhost',
		port: 8080,
		auth: {
			type: 'basic',
			strategy: 'basic',
			validate: async function (context, data) {
				if (data.username === 'foo' && data.password === 'bar') {
					return { valid: true, credential: { username: 'foo'} };
				} else {
					return { valid: false };
				}
			}
		},
		routes: routes
	});

	server.on('error', function (error) {
		console.error(error);
	});

	server.on('request', function (req) {
		// console.log(req.url);
	});

	server.on('open', function () {
		console.log('open');
	});

	server.on('close', function () {
		console.log('close');
	});

	await server.open();

	console.log(server.port);

	// setTimeout(async function () {
	// 	await server.close();
	// }, 3000);

}()).catch(function (error) {
	console.error(error);
});
