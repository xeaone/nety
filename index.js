const Status = require('./lib/status');
const Http = require('http');
const Util = require('util');
const Path = require('path');
const Url = require('url');
const Fs = require('fs');

const PORT = 8080;
const DIRECTORY = '.';
const HOSTNAME = 'localhost';

function Server (options) {
	options = options || {};

	this.port = options.port || PORT;
	this.hostname = options.hostname || HOSTNAME;
	this.spa = options.spa === null || options.spa === undefined ? false : options.spa;

	this.directory = Path.join(
		Path.dirname(process.argv[1]),
		options.directory ? Path.normalize(options.directory) : DIRECTORY
	);
}

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
	var self = this, hasExtension;

	hasExtension = self.hasExtension(path);
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

Server.prototype.handler = function (req, res) {
	var self = this, status, stream;

	self.responsePath(req.url, function (error, path) {
		if (error) {
			status = Status(error.code);
			res.writeHead(status.code, status.message);
			return res.end(JSON.stringify(status))
		};

		stream = Fs.createReadStream(path).on('error', function () {
			status = Status(404);
			res.writeHead(status.code, status.message);
			return res.end(JSON.stringify(status))
		});

		status = Status(200);
		res.writeHead(status.code, status.message);
		stream.pipe(res);
	});
};

Server.prototype.listener = function (callback) {
	var self = this;
	console.log(`Servey listening on ${self.hostname}:${self.port}`);
	if (callback) return callback.call(self, self.server);
};

Server.prototype.listen = function (callback) {
	var self = this;

	self.server = Http.createServer(function (req, res) {
		self.handler(req, res);
	});

	self.server.listen(self.port, self.hostname, function () {
		self.listener(callback);
	});
};

module.exports = function(options) {
	return new Server(options);
};
