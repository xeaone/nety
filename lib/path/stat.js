'use strict';

const Util = require('util');
const Path = require('path');
const Url = require('url');
const Fs = require('fs');

const Stat = Util.promisify(Fs.stat);

module.exports = async function (data) {
	let url, path, stat, error;

	// might want for safty
	// if (path.indexOf(data.path) !== 0) {
	// 	return { code: 403 };
	// }

	url = Url.parse(data.url);

	path = url.pathname;
	path = !path ? data.file : path;
	path = !Path.extname(path) ? Path.join(path, data.file) : path;

	// TODO make this optional
	if (path.slice(-1) === '/') {
		return {
			code: 301,
			path: `${url.pathname.slice(0, -1)}${url.search || ''}${url.hash || ''}`,
		};
	}

	try {
		stat = await Stat(Path.join(data.folder, path));
	} catch (e) {
		error = e;
	}

	if (data.spa) {
		if (error) {
			if (error.code === 'ENOENT') {
				return {
					code: 200,
					path: Path.join(data.folder, data.file)
				};
			} else if (error.code === 'EACCES') {
				return { code: 403 };
			}
		} else {
			if (stat.isFile()) {
				return {
					code: 200,
					path: Path.join(data.folder, path)
				};
			} else {
				return {
					code: 200,
					path: Path.join(data.folder, data.file)
				};
			}
		}
	} else {
		if (error) {
			if (error.code === 'ENOENT') {
				return { code: 404 };
			} else if (error.code === 'EACCES') {
				return { code: 403 };
			} else {
				throw error;
			}
		} else {
			if (stat.isFile()) {
				return {
					code: 200,
					path: Path.join(data.folder, path)
				};
			// } else if (stat.isDirectory()) {
			// 	return {
			// 		code: 200,
			// 		path: Path.join(data.folder, path, data.file)
			// 	};
			} else {
				return {
					code: 200,
					path: Path.join(data.folder, path, data.file)
				};
			}
		}
	}

};
