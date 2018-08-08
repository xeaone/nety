
const Servey = require('../lib/server');
const Path = require('path');
const Fs = require('fs');
const Url = require('url');
const Jwt = require('jsonwebtoken');
const Util = require('util');

const JwtSign = Util.promisify(Jwt.sign);

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
		// 	path: '/token',
		// 	method: 'get',
		// 	options: {
		// 		auth: false
		// 	},
		// 	handler: async function (context) {
		// 		const token = await JwtSign({ email: 'test@mail.com' }, 'secret');
		// 		return {
		// 			body: token
		// 		};
		// 	}
		// },
		// {
		// 	path: '/secure-cookie',
		// 	method: 'get',
		// 	options: {
		// 		auth: {
		// 			strategy: 'session',
		// 			secret: 'secret',
		// 			location: 'cookie',
		// 			validate: async function (context, result) {
		// 				if (result.decoded.email === 'test@mail.com') {
		// 					return { valid: true, credential: result.decoded };
		// 				} else {
		// 					return { valid: false };
		// 				}
		// 			}
		// 		}
		// 	},
		// 	handler: async function (context) {
		// 		return {
		// 			body: context.credential
		// 		};
		// 	}
		// },
		{
			path: '/secure-cookie',
			method: 'GET',
			options: {
				auth: {
					secret: 'secret',
					location: 'cookie',
					strategy: 'session',
					validate: async function (context, result) {
						console.log(result);
						if (result.decoded.email === 't@t.t') {
							return { valid: true, credential: result.decoded };
						} else {
							return { valid: false };
						}
					}
				}
			},
			handler: async function (context) {
				return {
					head: { 'content-type': 'text/plain;charset=utf-8' },
					body: context.payload
				};
			}
		},
		{
			path: '/login-cookie',
			method: 'POST',
			handler: async function (context) {
				return {
					head: {
						'set-cookie': 'name=value',
						'content-type': 'text/plain;charset=utf-8'
					},
					body: context.payload
				};
			}
		},
		{
			path: '/login-cookie',
			method: 'GET',
			handler: async function (context) {
				return {
					head: { 'content-type': 'text/html;charset=utf-8' },
					body: `
					<form method="post" action="/login-cookie">
						<input name="email" type="text" placeholder="Email" required/>
						<input name="password" type="text" placeholder="Password" required/>
						<input type="submit" value="Send"/>
					</form>
					`
				};
			}
		},
		// {
		// 	path: '/credential',
		// 	method: 'get',
		// 	options: {
		// 		auth: {
		// 			strategy: 'jwt',
		// 			secret: 'secret',
		// 			location: 'query',
		// 			validate: async function (context, result) {
		// 				if (result.decoded.email === 'test@mail.com') {
		// 					return { valid: true, credential: result.decoded };
		// 				} else {
		// 					return { valid: false };
		// 				}
		// 			}
		// 		}
		// 	},
		// 	handler: async function (context) {
		// 		return {
		// 			body: context.credential
		// 		};
		// 	}
		// },
		// {
		// 	path: '/private',
		// 	method: 'get',
		// 	options: {
		// 		auth: {
		// 			type: 'basic',
		// 			strategy: 'basic',
		// 			validate: async function (context, data) {
		// 				if (data.username === 'loo' && data.password === 'bar') {
		// 					return { valid: true, credential: { username: 'loo'} };
		// 				} else {
		// 					return { valid: false };
		// 				}
		// 			}
		// 		}
		// 	},
		// 	handler: async function (context) {
		// 		return {
		// 			body: 'private'
		// 		};
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
		// {
		// 	path: '*',
		// 	method: 'get',
		// 	options: {
		// 		vhost: ['localhost:8080', 'testcom.localhost:8080'],
		// 	},
		// 	handler: async function (context) {
		// 		return await context.tool.static({
		// 			spa: true,
		// 			folder: './test/static',
		// 			path: context.url.pathname
		// 		});
		// 	}
		// }
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
