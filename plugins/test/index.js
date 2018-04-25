
const Servey = require('../index');
const Path = require('path');
const Fs = require('fs');

(async function () {

	const server = new Servey({
		cache: false,
		cors: true,
		port: 8080,
		routes: [
			{
				path: '*',
				method: 'get',
				handler: async function (req, res) {
					return await this.plugin.static({
						spa: true,
						path: this.path,
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
