const Servey = require('../index');

var options = {
	spa: true,
	cors: true,
	cache: true,
	port: 8080,
	path: __dirname + '/static'
};

var server = new Servey(options);

server.on('error', function (error) {
	console.log(error);
});

server.on('request', function (req) {
	// console.log(req.url);
});

server.open(function () {
	console.log('open');
});

// server.close(function () {
// 	console.log('close');
// });
