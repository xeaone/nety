
const Servey = require('../index');
const Path = require('path');
const Fs = require('fs');
const Url = require('url');

(async function () {

	const server = new Servey({
		cache: false,
		port: 8080,
		auth: {
			type: 'Basic',
			name: 'basic',
			validate: async function (username, password) {
				if (username === 'foo' && password === 'bar') {
					return { valid: true, credentials: { username: 'foo'} };
				} else {
					return { valid: false };
				}
			}
		},
		routes: [
			{
				path: '*',
				method: 'get',
				handler: async function (req, res) {
					const url = Url.parse(req.url);
					return await this.plugin.static({
						spa: true,
						path: url.pathname,
						folder: './test/static'
					});
				}
			}
		]
	});

	server.on('error', function (error) {
		console.error(error);
	});

	server.on('request', function (req) {
		console.log(req.url);
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
