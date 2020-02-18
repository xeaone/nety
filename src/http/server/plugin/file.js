'use strict';

const Fs = require('fs');
const Path = require('path');
const Util = require('util');
const Stat = Util.promisify(Fs.stat);

module.exports = class File {

    constructor (options = {}) {
        this.folder = options.folder || 'public';
        this.file = options.file || 'index.html';
        this.error = options.error || 'error.html';
        this.spa = typeof options.spa === 'boolean' ? options.spa : false;

        if (!this.file) throw new Error('file option required');
        if (!this.error) throw new Error('error option required');
        if (!this.folder) throw new Error('folder option required');

        // this.restrict = /^(\.)+/;
        // this.illegal = /[\/\?<>\\:\*\|"]/g;
        // this.control = /[\x00-\x1f\x80-\x9f]/g;
        // this.reserved = /^\.+$/;
        // this.windowsReserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
        // this.windowsTrailing = /[\. ]+$/;
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

    async valid (data) {
       const parts = data.split('/');
       for (const part of parts) {
           if (Buffer.byteLength(part) >= 255) {
               return false;
           }
       }
       return true;
    }

    async method (context, options = {}) {
        const data = { ...options };

        data.spa = typeof data.spa === 'boolean' ? data.spa : this.spa;

        data.file = data.file || this.file;
        data.error = data.error || this.error;
        data.folder = data.folder || this.folder;
        data.path = data.path || data.file || this.file;

        data.file = Path.normalize(data.file);
        data.path = Path.normalize(data.path);
        data.error = Path.normalize(data.error);
        data.folder = Path.normalize(data.folder);

        data.folder = Path.resolve(data.folder);
        data.path = Path.extname(data.path) ? data.path : Path.join(data.path, data.file);

        const [ fileValid, pathValid, errorValid, folderValid  ] = await Promise.all([
            this.valid(data.file),
            this.valid(data.path),
            this.valid(data.error),
            this.valid(data.folder)
        ]);

        if (!fileValid || !pathValid || !errorValid || !folderValid) {
            return context.code(414);
        }

        const spaPath = Path.join(data.folder, data.file);
        const fullPath = Path.join(data.folder, data.path);
        const errorPath = Path.join(data.folder, data.error);

        if (
            !spaPath.startsWith(data.folder) ||
            !fullPath.startsWith(data.folder) ||
            !errorPath.startsWith(data.folder)
        ) {
            return context.code(403);

            // try {
            //     const stat = await Stat(errorPath);
            //     await this.stream(context, errorPath, stat);
            // } catch (e) { /* ignore */ }
            //
            // return;
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

            } else if (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM') {
                context.code(error.code === 'ENOENT' ? 404 : 403);

                try {
                    const stat = await Stat(errorPath);
                    await this.stream(context, errorPath, stat);
                } catch (e) { /* ignore */ }

            } else {
                throw error;
            }

        }

        if (data.code) {
            context.code(data.code);
        }

    }

    async handle (context) {
        return this.method.bind(this, context);
    }

}
