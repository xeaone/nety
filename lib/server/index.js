'use strict';

const Fs = require('fs');
const Path = require('path');
const Util = require('util');

const Utility = require('../utility');
const PathStat = require('../path/stat');

function Server (options) {
	options = options || {};

	this.port = options.port || 0;
	this.spa = options.spa || false;
	this.cors = options.cors || false;
	this.cache = options.cache || false;
	this.secure = options.secure || false;
	this.host = options.host || '0.0.0.0';
	this.file = options.file || 'index.html';
	this.hostname = options.hostname || 'localhost';
	this.folder = options.folder ? Path.normalize(options.folder) : 'public';

	if (!Path.isAbsolute(this.folder)) {
		const root = Path.extname(process.argv[1]) ? Path.dirname(process.argv[1]) : process.argv[1];
		this.folder = Path.resolve(root, this.folder);
	}

}

Server.prototype.setup = async function (request, response) {

	const data = {
		path: '/',
		code: 200,
		cors: this.cors,
		cache: this.cache
	};

	try {
		const stat = await PathStat({
			spa: this.spa,
			file: this.file,
			url: request.url,
			folder: this.folder
		});

		data.path = stat.path || data.path;
		data.code = stat.code || data.code;

		await this.request(request, response, data);
	} catch (error) {
		const header = Utility.createHeader(data);
		const result = Utility.statusString(500);

		response.writeHead(500, header);
		response.end(result);

		this.emit('error', error);

	}
};

Server.prototype.request = async function (request, response, data) {
	if (data.code === 200) {
		const stream = Fs.createReadStream(data.path);

		stream.on('error', function () {
			const header = Utility.createHeader(data);
			const result = Utility.statusString(500);
			response.writeHead(500, header);
			response.end(result);
		});

		stream.on('open', function () {
			const header = Utility.createHeader(data);
			response.writeHead(200, header);
		});

		stream.on('close', function () {
			response.end();
		});

		stream.pipe(response);
	} else {
		const header = Utility.createHeader(data);

		if (data.code === 301) {
			header.Location = data.path;
		}

		const result = Utility.statusString(data.code);

		response.writeHead(data.code, header);
		response.end(result);
	}
};

Server.prototype.open = function () {
	const self = this;
	return new Promise(function (resolve, reject) {
		return self.listen({ port: self.port, host: self.host }, function () {
			const address = self.address();
			self.port = address.port;
			self.host = address.host;
			resolve();
			self.emit('open');
		});
	});
};

Server.prototype.close = function () {
	const self = this;
	return new Promise(function (resolve, reject) {
		return self.close(function () {
			resolve();
			self.emit('close');
		});
	});
};

module.exports = Server;
