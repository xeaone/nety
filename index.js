const Utility = require('./lib/utility');
const Events = require('events');
const Http = require('http');
const Util = require('util');
const Path = require('path');
const Url = require('url');
const Fs = require('fs');

const PATH = '.';
const UTF8 = 'utf8';
const ENOENT = 'ENOENT';
const EACCES = 'EACCES';
const HOSTNAME = 'localhost';

function Servey (options) {
	const self = this;

	Events.EventEmitter.call(self);

	options = options || {};
	self.port = options.port || 0;
	self.spa = options.spa || false;
	self.cors = options.cors || false;
	self.cache = options.cache || false;
	self.hostname = options.hostname || HOSTNAME;
	self.path = options.path ? Path.normalize(options.path) : PATH;

	if (!Path.isAbsolute(self.path)) {
		self.path = Path.join(
			Path.dirname(process.argv[1]),
			self.path
		);
	}

	self.server = self.http.createServer();

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

	self.server.on('upgrade', function (request, socket, head) {
		self.emit('upgrade', request, socket, head);
	});

	self.server.on('request', function (request, response) {
		self.responsePath(request.url, function (code, path) {
			var result, stream;

			var header = {
				path: path,
				code: code,
				cors: self.cors,
				cache: self.cache
			};

			if (code) {
				header = Utility.createHeader(header);
				result = Utility.statusString(code);
				response.writeHead(code, header);
				response.end(result);
			} else {
				stream = Fs.createReadStream(path);

				stream.setEncoding(UTF8);

				stream.on('error', function () {
					code = 500;
					header = Utility.createHeader(header);
					result = Utility.statusString(code);
					response.writeHead(code, header);
					response.end(result);
				});

				stream.on('open', function () {
					code = 200;
					header = Utility.createHeader(header);
					response.writeHead(code, header);
				});

				stream.on('close', function () {
					response.end();
				});

				stream.pipe(response);
			}
		});

		self.emit('request', request, response);
	});

}

Servey.prototype = Object.create(Events.EventEmitter.prototype);
Servey.prototype.constructor = Servey;

Servey.prototype.http = Http;

Servey.prototype.hasExtension = function (path) {
	return Path.extname(path) !== '';
};

Servey.prototype.parsePath = function (path) {
	path = Url.parse(path).pathname;
	path = Path.normalize(path);
	path = Path.extname(path) === '' ? Path.join(path, 'index.html') : path;
	path = Path.join(this.path, path);
	return path;
};

Servey.prototype.responsePath = function (path, callback) {
	const self = this;

	var hasExtension = self.hasExtension(path);
	path = self.parsePath(path);

	Fs.stat(path, function (error, stat) {
		if (error) {
			if (error.code === ENOENT) {
				if (self.spa) {
					if (hasExtension) {
						return callback(404);
					} else {
						return callback(null, Path.join(self.path, 'index.html'));
					}
				} else {
					return callback(404);
				}
			} else if (error.code === EACCESS) {
				return callback(403);
			} else {
				return callback(500);
			}
		} else {
			if (stat.isFile()) {
				return callback(null, path);
			} else if (stat.isDirectory()) {
				return callback(null, Path.join(self.path, 'index.html'));
			} else {
				return callback(500);
			}
		}
	});
};

Servey.prototype.open = function (callback) {
	const self = this;

	self.server.listen(self.port, self.hostname, function () {
		self.port = self.server.address().port;
		self.emit('open');
		if (callback) callback();
	});
};

Servey.prototype.close = function (callback) {
	const self = this;

	self.on('open', function () {
		self.server.close(function () {
			self.emit('close');
			if (callback) callback();
		});
	});
};

module.exports = Servey;

// module.exports = function(options) {
// 	return new Server().create(options);
// };
