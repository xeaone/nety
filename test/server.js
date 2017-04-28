const Servey = require('../index');

var options = {
	spa: true,
	directory: 'static'
};

var server = Servey(options);

server.open(function () {
	console.log('open');
});

server.request(function (req) {
	console.log(req.url);
});

// server.close(function () {
// 	console.log('close');
// });
