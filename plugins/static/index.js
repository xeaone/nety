'use strict';

const Fs = require('fs');
const Path = require('path');
const Stat = require('./stat');

module.exports = {

	name: 'static',

	handler: async function (data) {
		const result = {};

		data = data || {};
		data = typeof data === 'string' ? { path: data } : data;

		const path = data.path || '/';
		const file = data.file || 'index.html';
		const folder = Path.resolve(data.folder || 'public');
		const spa = data.spa === undefined || data.spa === null ? false : data.spa;

		const stat = await Stat({
			spa: spa,
			path: path,
			file: file,
			folder: folder
		});

		result.code = stat.code;

		if (stat.path) {
			result.body = Fs.createReadStream(stat.path);
		}

		return result;
	}

};
