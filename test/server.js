
const Servey = require('../lib/server');
const Path = require('path');
const Fs = require('fs');
const Url = require('url');
const Jwt = require('jsonwebtoken');
const Util = require('util');

const JwtSign = Util.promisify(Jwt.sign);

const EMAIL = 't@t.t';
const SECRET = 'secret';

(async function () {

	const routes = [
		{
			path: '/status/okay',
			method: 'get',
			options: { auth: false },
			handler: async function (context) {
				return context.tool.status.custom(200, 'Good To Go');
			}
		},
		{
			path: '/status/bad',
			method: 'get',
			options: { auth: false },
			handler: async function (context) {
				return context.tool.status.badData();
			}
		},
		{
			path: '/payload',
			method: 'post',
			options: {
				auth: false
			},
			handler: async function (context) {
				console.log(context.payload);
			}
		},
		{
			path: '/token',
			method: 'get',
			options: {
				auth: false
			},
			handler: async function (context) {
				const token = await JwtSign({ email: 'test@mail.com' }, SECRET);
				return {
					body: token
				};
			}
		},
		{
			path: '/secure-cookie',
			method: 'get',
			options: {
				auth: {
					strategy: 'session',
					secret: SECRET,
					location: 'cookie',
					validate: async function (context, result) {
						if (result.decoded.email === 'test@mail.com') {
							return { valid: true, credential: result.decoded };
						} else {
							return { valid: false };
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
			path: '/secure-cookie',
			method: 'GET',
			options: {
				auth: {
					secret: SECRET,
					location: 'query',
					validate: async function (context, result) {
						if (result.decoded.email === 'test@mail.com') {
							return { valid: true, credential: result.decoded };
						} else {
							return { valid: false };
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
			path: '/sign-in',
			method: 'POST',
			handler: async function (context) {
				if (context.payload.type === 'jwt') {
					const token = await JwtSign({ email: 'test@mail.com' }, SECRET);
				}
				return {
					body: context.payload,
					cookie: { username: 't' }
				};
			}
		},
		{
			path: '/sign-in',
			method: 'GET',
			handler: async function (context) {
				return {
					head: {
						'content-type': 'text/html;charset=utf-8'
					},
					body: `
						<h1>Sign In</h1>
						<form method="post" action="/sign-in">
							<input name="email" type="text" placeholder="Email" required>
							<input name="password" type="text" placeholder="Password" required>
							<input name="type" type="radio" value="cookie">Cookie <br>
							<input name="type" type="radio" value="jwt">Jwt <br>
							<input type="submit" value="Send"/>
						</form>
					`
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
		port: 8080,
		debug: true,
		cache: false,
		hostname: 'localhost',
		// auth: {
		// 	type: 'basic',
		// 	strategy: 'basic',
		// 	validate: async function (context, data) {
		// 		if (data.username === 'foo' && data.password === 'bar') {
		// 			return { valid: true, credential: { username: 'foo'} };
		// 		} else {
		// 			return { valid: false };
		// 		}
		// 	}
		// },
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
