'use strict';

const Util = require('util');
const Path = require('path');
const Fs = require('fs');

const Stat = Util.promisify(Fs.stat);

const ErrorPath = async function (path, code) {
	let result = null;

	try {
		const stat = await Stat(path);
		if (stat.isFile()) result = path;
	} catch (e) { /* ignore */ }

	return result;
};

module.exports = async function (data) {

	let path = data.path;

	path = !path ? data.file : path;
	path = !Path.extname(path) ? Path.join(path, data.file) : path;

	const result = {};
	const fullPath = Path.join(data.folder, path);
	const spaPath = Path.join(data.folder, data.file);
	const errorPath = Path.join(data.folder, 'error.html');

	try {
		const stat = await Stat(fullPath);

		if (stat.isFile()) {
			result.code = 200;
			result.path = fullPath;
		} else if (data.spa) {
			result.code = 200;
			result.path = spaPath;
		} else {
			result.code = 404;
			result.path = await ErrorPath(errorPath);
		}

	} catch (error) {

		if (error.code === 'ENOENT' && data.spa) {
			result.code = 200;
			result.path = spaPath;
		} else if (error.code === 'ENOENT') {
			result.code = 404;
			result.path = await ErrorPath(errorPath);
		} else if (error.code === 'EACCES') {
			result.code = 403;
			result.path = await ErrorPath(errorPath);
		} else {
			throw error;
		}

	}

	return result;
};
