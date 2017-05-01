const Headers = require('./lib/headers');
const Events = require('events');
const Http = require('http');
const Util = require('util');
const Path = require('path');
const Url = require('url');
const Fs = require('fs');

const PORT = 8080;
const DIRECTORY = '.';
const HOSTNAME = 'localhost';

function Server () { Events.EventEmitter.call(this); }

Server.prototype = Object.create(Events.EventEmitter.prototype);
Server.prototype.constructor = Server;

Server.prototype.hasExtension = function (path) {
	return Path.extname(path) !== '';
};

Server.prototype.parsePath = function (path) {
	path = path.replace(/(\.){2,}\//, '');
	path = Url.parse(path).pathname;
	path = Path.normalize(path);
	path = Path.extname(path) === '' ? Path.join(path, 'index.html') : path;
	path = Path.join(this.directory, path);
	return path;
};

Server.prototype.responsePath = function (path, callback) {
	const self = this;

	var hasExtension = self.hasExtension(path);
	path = self.parsePath(path);

	Fs.stat(path, function (error, stat) {
		if (self.spa) {
			if (error && hasExtension) return callback({ code: 404 });
			else if (error && !hasExtension) return callback(null, Path.join(self.directory, 'index.html'));
			else if (stat.isFile()) return callback(null, path);
			else return callback(null, Path.join(self.directory, 'index.html'));
		} else {
			if (error) return callback({ code: 404 });
			else if (stat.isFile()) return callback(null, path);
			else if (stat.isDirectory()) return callback(null, Path.join(self.directory, 'index.html'));
			else return callback({ code: 400 });
		}
	});
};

Server.prototype.open = function (callback) {
	const self = this;

	self.server.listen(self.port, self.hostname, function () {
		self.emit('open');
		if (callback) callback();
	});
};

Server.prototype.close = function (callback) {
	const self = this;

	self.on('open', function () {
		self.server.close(function () {
			self.emit('close');
			if (callback) callback();
		});
	});
};

Server.prototype.create = function (options) {
	const self = this;

	options = options || {};
	self.port = options.port || PORT;
	self.cors = options.cors || false;
	self.hostname = options.hostname || HOSTNAME;
	self.spa = options.spa === null || options.spa === undefined ? false : options.spa;
	self.directory = options.directory ? Path.normalize(options.directory) : DIRECTORY;

	if (!Path.isAbsolute(self.directory)) {
		self.directory = Path.join(
			Path.dirname(process.argv[1]),
			self.directory
		);
	}

	self.server = Http.createServer(function (request, response) {
		response.setHeaders

		self.responsePath(request.url, function (error, path) {
			var header, stream;

			if (error) {
				header = Headers(error.code, self.cors);
				response.writeHead(header.code, header);
				response.end(JSON.stringify(header));
			} else {
				stream = Fs.createReadStream(path);

				stream.on('error', function () {
					header = Headers(404, self.cors);
					response.writeHead(header.code, header);
					response.end(JSON.stringify(header));
				});

				stream.on('open', function () {
					header = Headers(200, self.cors);
					response.writeHead(header.code, header);
				});

				stream.on('close', function () {
					response.end();
				});

				stream.pipe(response);
			}
		});
	});

	self.server.on('checkContinue', function (request, response) {
		self.emit('checkContinue', request, response);
	});

	self.server.on('checkExpectation', function (request, response) {
		self.emit('checkExpectation', request, response);
	});

	self.server.on('clientError', function (exception, socket) {
		self.emit('clientError', exception, socket);
	});

	self.server.on('close', function () {
		self.emit('close');
	});

	self.server.on('connect', function (request, socket, head) {
		self.emit('connect', request, socket, head);
	});

	self.server.on('connection', function (socket) {
		self.emit('connection', socket);
	});

	self.server.on('request', function (request, response) {
		self.emit('request', request, response);
	});

	self.server.on('upgrade', function (request, socket, head) {
		self.emit('upgrade', request, socket, head);
	});

	return self;
};

module.exports = function(options) {
	return new Server().create(options);
};
