
const Servey = require('../index');
const Path = require('path');

(async function () {

	const server = Servey.create({
		// spa: true,
		// cors: true,
		// cache: true,
		port: 8080,
		folder: Path.join(__dirname, 'static')
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
