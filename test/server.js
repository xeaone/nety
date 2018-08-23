
const Servey = require('../lib/server');
const Path = require('path');
const Fs = require('fs');
const Url = require('url');
const Util = require('util');
const Toked = require('toked');
const Jwt = require('jsonwebtoken');

const JwtSign = Util.promisify(Jwt.sign);

const USERNAME = 't';
const PASSWORD = 't';
const EMAIL = 't@t.t';
const SECRET = 'secret';

(async function () {

	const routes = [
		// {
		// 	path: '/status/okay',
		// 	method: 'get',
		// 	options: { auth: false },
		// 	handler: async function (context) {
		// 		return context.tool.status.custom(200, 'Good To Go');
		// 	}
		// },
		// {
		// 	path: '/status/bad',
		// 	method: 'get',
		// 	options: { auth: false },
		// 	handler: async function (context) {
		// 		return context.tool.status.badData();
		// 	}
		// },
		// {
		// 	path: '/payload',
		// 	method: 'post',
		// 	options: {
		// 		auth: false
		// 	},
		// 	handler: async function (context) {
		// 		console.log(context.payload);
		// 	}
		// },
		// {
		// 	path: '/public',
		// 	method: 'get',
		// 	options: {
		// 		auth: false
		// 	},
		// 	handler: async function (context) {
		// 		return {
		// 			body: 'public'
		// 		};
		// 	}
		// },
		{
			path: '/session',
			method: 'get',
			options: {
				auth: {
					secret: SECRET,
					type: 'cookie',
					strategy: async function (context, token, auth) {
						console.log(token);
						console.log(auth);
					},
					validate: async function (context, result) {
						if (result.decoded.username === USERNAME) {
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
			path: '/cookie',
			method: 'get',
			options: {
				auth: {
					secret: SECRET,
					type: 'cookie',
					strategy: 'jwt',
					// strategy: Toked.value,
					validate: async function (context, result) {
						if (result.decoded.username === USERNAME) {
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
			path: '/basic',
			method: 'get',
			options: {
				auth: {
					type: 'basic',
					validate: async function (context, credential) {
						if (credential.username === 't' && credential.password === 't') {
							return { valid: true, credential: { username: credential.username } };
						} else {
							return { valid: false };
						}
					}
				}
			},
			handler: async function (context) {
				return {
					body: 'basic'
				};
			}
		},
		{
			path: '/sign-in',
			method: ['get','post'],
			handler: async function (context) {

				if (context.method === 'POST') {
					let cookie;

					if (context.payload.username !== USERNAME || context.payload.password !== PASSWORD) {
						return context.tool.status.unauthorized();
					}

					switch (context.payload.type) {
						case 'jwt':
							cookie = await JwtSign({ username: USERNAME }, SECRET);
							break;
						case 'cookie':
							context.tools.cookie.create({ username: USERNAME });
							break;
					}

					return {
						head: {
							'set-cookie': cookie
						},
						body: {
							cookie: cookie,
							payload: context.payload
						}
					};
				}

				return {
					head: {
						'content-type': 'text/html;charset=utf-8'
					},
					body: `
						<h1>Sign In</h1>
						<form method="post" action="/sign-in">
							<input name="username" type="text" placeholder="Username" required><br>
							<input name="password" type="text" placeholder="Password" required><br>
							<input name="type" type="radio" value="session" required>Session<br>
							<input name="type" type="radio" value="jwt" required>JWT<br>
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
		tools: [
			Toked
		],
		// auth: {
		// 	type: 'basic',
		// 	type: 'basic',
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

	server.on('request', function (request) {
		console.log(request.url);
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
