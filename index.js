const Status = require('./lib/status');
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
		console.log(`Servey listening on ${self.hostname}:${self.port}`);
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

Server.prototype.request = function (callback) {
	const self = this;

	self.on('request', function (request, response) {
		if (callback) callback(request, response);
	});
};

Server.prototype.create = function (options) {
	const self = this;

	options = options || {};
	self.port = options.port || PORT;
	self.hostname = options.hostname || HOSTNAME;
	self.spa = options.spa === null || options.spa === undefined ? false : options.spa;

	self.directory = Path.join(
		Path.dirname(process.argv[1]),
		options.directory ? Path.normalize(options.directory) : DIRECTORY
	);

	self.status, self.stream;

	self.server = Http.createServer(function (request, response) {
		self.responsePath(request.url, function (error, path) {
			if (error) {
				self.status = Status(error.code);
				response.writeHead(self.status.code, self.status.message);
				response.end(self.status.string());
				self.emit('request', request, response, self.status);
			} else {
				self.stream = Fs.createReadStream(path);

				self.stream.on('error', function () {
					self.status = Status(404);
					response.writeHead(self.status.code, self.status.message);
					response.end(self.status.string());
					self.emit('request', request, response, self.status);
				});

				self.stream.on('open', function () {
					self.status = Status(200);
					response.writeHead(self.status.code, self.status.message);
				});

				self.stream.on('close', function () {
					response.end();
					self.emit('request', request, response, self.status);
				});

				self.stream.pipe(response);
			}
		});
	});

	return self;
};

module.exports = function(options) {
	return new Server().create(options);
};
