'use strict';

const Fs = require('fs');
const Path = require('path');
const Util = require('util');
const Stat = Util.promisify(Fs.stat);

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

        // const result = {};
        // const result = { head: this.context.head };
        const extension = Path.extname(data.path).slice(1);
        const spaPath = Path.join(data.folder, data.file);
        const fullPath = Path.join(data.folder, data.path);
        const errorPath = Path.join(data.folder, 'error.html');

        if (fullPath.indexOf(data.folder) !== 0) {
            this.context.code = 403;
            this.context.body = await ErrorHandler(errorPath);
            return this.context;
        }

        if (fullPath.indexOf('\u0000') !== -1) {
            this.context.code = 404;
            this.context.body = await ErrorHandler(errorPath);
            return this.context;
        }

        try {
            const stat = await Stat(fullPath);

            if (stat.isFile()) {
                const range = this.context.request.headers.range;

                if (range) {
                    const parts = range.replace(/bytes=/, '').split('-');
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : stat.size-1;
                    // const size = (end-start)+1;

                    this.context.code = 206;
                    // this.context.head['content-length'] = size;
                    this.context.head['accept-ranges'] = 'bytes';
                    this.context.head['content-range'] = `bytes ${start}-${end}/${stat.size}`;

                    this.context.body = Fs.createReadStream(fullPath, { start, end });
                } else {
                    this.context.code = 200;
                    // this.context.head['content-length'] = stat.size;
                    this.context.body = Fs.createReadStream(fullPath);
                }
            } else if (data.spa) {
                this.context.code = 200;
                this.context.body = Fs.createReadStream(spaPath);
            } else {
                this.context.code = 404;
                this.context.body = await ErrorHandler(errorPath);
            }

        } catch (error) {

            if (error.code === 'ENOENT' && data.spa) {

                if (!extension || extension === 'html') {
                    this.context.code = 200;
                    this.context.body = Fs.createReadStream(spaPath);
                } else {
                    this.context.code = 404;
                    this.context.body = await ErrorHandler(errorPath);
                }
                // } else if (fullPath.indexOf('\u0000') !== -1 || error.code === 'ENOENT') {
                // 	this.context.code = 404;
                // 	this.context.body = await ErrorHandler(errorPath);
            } else if (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM') {
                this.context.code = error.code === 'ENOENT' ? 404 : 403;
                this.context.body = await ErrorHandler(errorPath);
            } else {
                throw error;
            }

        }

        return this.context;
    }
};
