const Servey = require('../index');

var options = {
	spa: true,
	directory: 'static'
};

var server = Servey(options);

server.listen(function () {
	console.log('ready');
});
