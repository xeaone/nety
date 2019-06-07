'use strict';

const Fs = require('fs');
const Path = require('path');
const Util = require('util');

const Stat = Util.promisify(Fs.stat);

const Stream = async function (path, stat) {
    const range = this.context.request.headers.range;

    this.context.head['accept-ranges'] = 'bytes';

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size;

        this.context.code = 206;
        this.context.head['content-length'] = (end-start);
        this.context.head['content-range'] = `bytes ${start}-${end-1}/${stat.size}`;
        this.context.body = Fs.createReadStream(path, { start, end });
    } else {
        this.context.head['content-length'] = stat.size;
        this.context.body = Fs.createReadStream(path);
    }

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

        const spaPath = Path.join(data.folder, data.file);
        const fullPath = Path.join(data.folder, data.path);
        const errorPath = Path.join(data.folder, 'error.html');

        if (fullPath.indexOf(data.folder) !== 0) {
            this.context.code = 403;

            try {
                const errorStat = await Stat(errorPath);
                await Stream.call(this, errorPath, errorStat);
            } catch (e) { /* ignore */ }

            return this.context;
        }

        if (fullPath.indexOf('\u0000') !== -1) {
            this.context.code = 404;

            try {
                const errorStat = await Stat(errorPath);
                await Stream.call(this, errorPath, errorStat);
            } catch (e) { /* ignore */ }

            return this.context;
        }

        try {
            let path = fullPath;
            let stat = await Stat(path);

            if (stat.isDirectory()) {
                path = Path.join(path, 'index.html');
                stat = await Stat(path);
            }

            if (stat.isFile()) {
                this.context.code = 200;
                await Stream.call(this, path, stat);
            } else if (data.spa === true) {
                this.context.code = 200;
                const spaStat = await Stat(spaPath);
                await Stream.call(this, spaPath, spaStat);
            } else {
                this.context.code = 404;

                try {
                    const errorStat = await Stat(errorPath);
                    await Stream.call(this, errorPath, errorStat);
                } catch (e) { /* ignore */ }

            }

        } catch (error) {

            if (error.code === 'ENOENT' && data.spa) {
                const extension = Path.extname(data.path).slice(1);

                if (!extension || extension === 'html') {
                    this.context.code = 200;
                    const spaStat = await Stat(spaPath);
                    await Stream.call(this, spaPath, spaStat);
                } else {
                    this.context.code = 404;

                    try {
                        const errorStat = await Stat(errorPath);
                        await Stream.call(this, errorPath, errorStat);
                    } catch (e) { /* ignore */ }

                }

            } else if (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM') {
                this.context.code = error.code === 'ENOENT' ? 404 : 403;

                try {
                    const errorStat = await Stat(errorPath);
                    await Stream.call(this, errorPath, errorStat);
                } catch (e) { /* ignore */ }

            } else {
                throw error;
            }

        }

        if (data.code) {
            this.context.code = data.code;
        }

        return this.context;
    }
};
