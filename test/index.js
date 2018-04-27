
const Servey = require('../lib/server');
const Path = require('path');
const Fs = require('fs');
const Url = require('url');

(async function () {

	const routes = [
		{
			path: '/difauth',
			method: 'get',
			options: {
				auth: {
					type: 'Basic',
					name: 'basic',
					validate: async function (context, username, password) {
						if (username === 'loo' && password === 'bar') {
							return { valid: true, credentials: { username: 'loo'} };
						} else {
							return { valid: false };
						}
					}
				}
			},
			handler: async function (context) {
				return {
					body: 'difauth'
				};
			}
		},
		{
			path: '/noauth',
			method: 'get',
			options: {
				auth: false
			},
			handler: async function (context) {
				return {
					body: 'noauth'
				};
			}
		},
		{
			path: '*',
			method: 'get',
			options: {
				vhost: ['test.com','localhost:8080'],
			},
			handler: async function (context) {
				return await context.plugin.static({
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
			type: 'Basic',
			name: 'basic',
			validate: async function (context, username, password) {
				if (username === 'foo' && password === 'bar') {
					return { valid: true, credentials: { username: 'foo'} };
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
