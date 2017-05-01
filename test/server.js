const Servey = require('../index');

var options = {
	spa: true,
	cors: true,
	directory: __dirname + '/static'
};

var server = Servey(options);

server.open(function () {
	console.log('open');
});

server.on('request', function (req) {
	console.log(req.url);
});

// server.close(function () {
// 	console.log('close');
// });
