'use strict';

const Fs = require('fs');
const Path = require('path');
const Util = require('util');
const Stat = Util.promisify(Fs.stat);

module.exports = class File {

    constructor (options = {}) {
        this.restrict = /^(\.)+/;
        this.file = options.file || 'index.html';
        this.error = options.error || 'error.html';
        this.folder = Path.resolve(options.folder || 'public');
        this.spa = typeof options.spa === 'boolean' ? options.spa : false;
    }

    async range (range, size) {
        let [ start, end ] = range.replace(/bytes=/, '').split('-');

        start = parseInt(start);
        end = parseInt(end);

        const result = {
            size,
            start: isNaN(start) ? 0 : start,
            end: isNaN(end) ? (size - 1) : end
        };

        if (!isNaN(start) && isNaN(end)) {
            result.start = start;
            result.end = size - 1;
        }

        if (isNaN(start) && !isNaN(end)) {
            result.start = size - end;
            result.end = size - 1;
        }

        return result;
    }

    async stream (context, path, stat) {
        const range = context.headers['range'];
        const extension = Path.extname(path).slice(1);
        const mime = context.mime[extension || 'default'];

        context.head('accept-ranges', 'bytes');
        context.head('content-type', `${mime};charset=${context._encoding}`);

        if (range) {
            const { start, end } = await this.range(range, stat.size);

            if (start >= stat.size || end >= stat.size) {
                context.head('content-range', `bytes */${stat.size}`).code(416).end();
            } else {
                context.code(206);
                context.head('content-length', start === end ? 0 : end-start+1);
                context.head('content-range', `bytes ${start}-${end}/${stat.size}`);
                context.body(Fs.createReadStream(path, { start, end }));
            }

        } else {
            context.head('content-length', stat.size);
            context.body(Fs.createReadStream(path));
        }

    }

    async method (context, options = {}) {
        const data = { ...options };

        data.file = data.file || this.file;
        data.error = data.error || this.error;
        data.spa = typeof data.spa === 'boolean' ? data.spa : this.spa;
        data.folder = data.folder ? Path.resolve(data.folder) : this.folder;

        data.path = data.path || data.file;
        data.path = data.path.replace(this.restrict, '.');
        data.path = Path.extname(data.path) ? data.path : Path.join(data.path, data.file);

        const spaPath = Path.join(data.folder, data.file);
        const fullPath = Path.join(data.folder, data.path);
        const errorPath = Path.join(data.folder, data.error);

        if (fullPath.indexOf(data.folder) !== 0) {
            context.code(403);

            try {
                const stat = await Stat(errorPath);
                await this.stream(context, errorPath, stat);
            } catch (e) { /* ignore */ }

            return;
            // return context.end();
        }

        if (fullPath.indexOf('\u0000') !== -1) {
            context.code(404);

            try {
                const stat = await Stat(errorPath);
                await this.stream(context, errorPath, stat);
            } catch (e) { /* ignore */ }

            // return context.end();
            return;
        }

        try {
            let path = fullPath;
            let stat = await Stat(path);

            if (stat.isDirectory()) {
                path = Path.join(path, 'index.html');
                stat = await Stat(path);
            }

            if (stat.isFile()) {
                context.code(data.code || 200);
                await this.stream(context, path, stat);
            } else if (data.spa === true) {
                context.code(data.code || 200);
                stat = await Stat(spaPath);
                await this.stream(context, spaPath, stat);
            } else {
                context.code(404);

                try {
                    const stat = await Stat(errorPath);
                    await this.stream(context, errorPath, stat);
                } catch (e) { /* ignore */ }

            }

            // return context.end();
        } catch (error) {

            if (error.code === 'ENOENT' && data.spa) {
                const extension = Path.extname(data.path).slice(1);

                if (!extension || extension === 'html') {
                    context.code(data.code || 200);
                    const stat = await Stat(spaPath);
                    await this.stream(context, spaPath, stat);
                } else {
                    context.code(404);

                    try {
                        const stat = await Stat(errorPath);
                        await this.stream(context, errorPath, stat);
                    } catch (e) { /* ignore */ }

                }

                // return context.end();
            } else if (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM') {
                context.code(error.code === 'ENOENT' ? 404 : 403);

                try {
                    const stat = await Stat(errorPath);
                    await this.stream(context, errorPath, stat);
                } catch (e) { /* ignore */ }

                // return context.end();
            } else {
                throw error;
            }

        }

        if (data.code) {
            context.code(data.code);
        }

        // return context.end();
    }

    async handle (context) {
        return this.method.bind(this, context);
    }

}
