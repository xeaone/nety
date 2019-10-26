'use strict';

const Fs = require('fs');
const Path = require('path');
const Util = require('util');
const Stat = Util.promisify(Fs.stat);

module.exports = class Static {

    constructor (options = {}) {
        this.restrict = /^(\.)+/;
        this.file = options.file || 'index.html';
        this.error = options.error || 'error.html';
        this.folder = Path.resolve(options.folder || 'public');
        this.spa = typeof options.spa === 'boolean' ? options.spa : false;
    }

    async stream (context, path, stat) {
        const range = context.headers['range'];

        context.head('accept-ranges', 'bytes');

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stat.size;

            context.code(206);
            context.head('content-length', (end-start));
            context.head('content-range', `bytes ${start}-${end-1}/${stat.size}`);
            context.body(Fs.createReadStream(path, { start, end }));
        } else {
            // context.head('transfer-encoding', 'chunked');
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
                // return context.end();
            } else if (data.spa === true) {
                context.code(data.code || 200);
                stat = await Stat(spaPath);
                await this.stream(context, spaPath, stat);
                // return context.end();
            } else {
                context.code(404);

                try {
                    const stat = await Stat(errorPath);
                    await this.stream(context, errorPath, stat);
                } catch (e) { /* ignore */ }

                // return context.end();
            }

        } catch (error) {

            if (error.code === 'ENOENT' && data.spa) {
                const extension = Path.extname(data.path).slice(1);

                if (!extension || extension === 'html') {
                    context.code(data.code || 200);
                    const stat = await Stat(spaPath);
                    await this.stream(context, spaPath, stat);
                    // return context.end();
                } else {
                    context.code(404);

                    try {
                        const stat = await Stat(errorPath);
                        await this.stream(context, errorPath, stat);
                    } catch (e) { /* ignore */ }

                    // return context.end();
                }

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

        // console.error('oops');

        // if (data.code) {
        //     context.code(data.code);
        // }
        //
        // return context.end();
    }

    async handle (context) {
        return this.method.bind(this, context);
    }

}
