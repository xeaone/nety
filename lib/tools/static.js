'use strict';

const Fs = require('fs');
const Path = require('path');
const Util = require('util');
const Stat = Util.promisify(Fs.stat);

// const ErrorHandler = async function (path, code) {
const ErrorHandler = async function (path) {
    try {
        const stat = await Stat(path);

        if (stat.isFile()) {
            return Fs.createReadStream(path);
        }

    } catch (e) { /* ignore */ }
};

const RESTRICT = /^(\.)+/;

module.exports = {
    name: 'static',
    value: async function (data) {

        data = data || {};
        data = typeof data === 'string' ? { path: data } : data;

        data.file = data.file || 'index.html';
        data.folder = Path.resolve(data.folder || 'public');
        data.spa = data.spa === undefined || data.spa === null ? false : data.spa;

        data.path = data.path || data.file;
        data.path = data.path.replace(RESTRICT, '.');
        data.path = Path.extname(data.path) ? data.path : Path.join(data.path, data.file);

        const result = {};
        const extension = Path.extname(data.path).slice(1);
        const spaPath = Path.join(data.folder, data.file);
        const fullPath = Path.join(data.folder, data.path);
        const errorPath = Path.join(data.folder, 'error.html');

        if (fullPath.indexOf(data.folder) !== 0) {
            result.code = 403;
            result.body = await ErrorHandler(errorPath);
            return result;
        }

        if (fullPath.indexOf('\u0000') !== -1) {
            result.code = 404;
            result.body = await ErrorHandler(errorPath);
            return result;
        }

        try {
            const stat = await Stat(fullPath);

            if (stat.isFile()) {
                result.code = 200;
                result.body = Fs.createReadStream(fullPath);
            } else if (data.spa) {
                result.code = 200;
                result.body = Fs.createReadStream(spaPath);
            } else {
                result.code = 404;
                result.body = await ErrorHandler(errorPath);
            }

        } catch (error) {

            if (error.code === 'ENOENT' && data.spa) {

                if (!extension || extension === 'html') {
                    result.code = 200;
                    result.body = Fs.createReadStream(spaPath);
                } else {
                    result.code = 404;
                    result.body = await ErrorHandler(errorPath);
                }
                // } else if (fullPath.indexOf('\u0000') !== -1 || error.code === 'ENOENT') {
                // 	result.code = 404;
                // 	result.body = await ErrorHandler(errorPath);
            } else if (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM') {
                result.code = error.code === 'ENOENT' ? 404 : 403;
                result.body = await ErrorHandler(errorPath);
            } else {
                throw error;
            }

        }

        return result;
    }
};
