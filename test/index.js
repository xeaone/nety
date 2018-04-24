
const Servey = require('../index');
const Path = require('path');
const Fs = require('fs');

(async function () {

	const server = Servey.create({
		spa: true,
		// cors: true,
		// cache: true,
		port: 8080,
		// folder: Path.join(__dirname, 'static')
		routes: [
			// {
			// 	path: '/',
			// 	method: 'get',
			// 	handler: async function (req, res) {
			// 		const path = Path.resolve('./test/static/index.html');
			// 		// return Fs.createReadStream(path);
			// 		// return res; broken
			// 		// return '';
			// 		return { test: 'test' };
			// 	}
			// }
			{
				path: '*',
				method: 'get',
				handler: Path.resolve('./test/static')
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

	await server.open();

	console.log(server.port);

	// setTimeout(async function () {
	// 	await server.close();
	// 	console.log('server close');
	// }, 3000);

}()).catch(function (error) {
	console.error(error);
});
