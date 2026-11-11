import { statSync, createReadStream } from 'node:fs';
import { resolve, join, normalize, extname } from 'node:path';
import type { Stats } from 'node:fs';
import type { Handle, HandleFunction, HandleInterface } from '../types.js';

import type Context from '../context.js';

export interface FileOptions {
    folder?: string;
    file?: string;
    error?: string;
    spa?: boolean;
}

export interface FileRequestOptions extends FileOptions {
    path?: string;
    code?: number;
}

export default class File {
    folder = 'public';
    file = 'index.html';
    error = 'error.html';
    spa = false;

    constructor(options: FileOptions = {}) {
        Object.assign(this, options);

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

    valid(data: string): boolean {
        const parts = data.split('/');
        for (const part of parts) {
            if (Buffer.byteLength(part) >= 255) {
                return false;
            }
        }
        return true;
    }

    range(range: string, size: number): { size: number; start: number; end: number } {
        const [startValue, endValue] = range.replace(/bytes=/, '').split('-');
        let start = parseInt(startValue);
        let end = parseInt(endValue);

        const result = {
            size,
            start: isNaN(start) ? 0 : start,
            end: isNaN(end) ? size - 1 : end,
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

    stream(context: Context, path: string, stat: Stats): void {
        const rangeHeader = context.headers['range'];
        const range = Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader;
        const extension = extname(path).slice(1);
        const mime = context.mime[extension || 'default'];

        context.head('accept-ranges', 'bytes');
        context.head('content-type', `${mime};charset=${context._encoding}`);

        if (range) {
            const { start, end } = this.range(range, stat.size);

            if (start >= stat.size || end >= stat.size) {
                context.head('content-range', `bytes */${stat.size}`).code(416).end();
            } else {
                context.code(206);
                context.head('content-length', start === end ? 0 : end - start + 1);
                context.head('content-range', `bytes ${start}-${end}/${stat.size}`);
                context.body(createReadStream(path, { start, end }));
            }
        } else {
            context.head('content-length', stat.size);
            context.body(createReadStream(path));
        }
    }

    method(context: Context, options: FileRequestOptions = {}) {
        const data: FileRequestOptions & { spa: boolean; file: string; error: string; folder: string; path: string } = {
            ...options,
            file: options.file || this.file,
            error: options.error || this.error,
            folder: options.folder || this.folder,
            path: options.path || options.file || this.file,
            spa: typeof options.spa === 'boolean' ? options.spa : this.spa,
        };

        data.file = normalize(data.file);
        data.path = normalize(data.path);
        data.error = normalize(data.error);
        data.folder = normalize(data.folder);

        data.folder = resolve(data.folder);
        data.path = extname(data.path) ? data.path : join(data.path, data.file);

        const fileValid = this.valid(data.file);
        const pathValid = this.valid(data.path);
        const errorValid = this.valid(data.error);
        const folderValid = this.valid(data.folder);

        if (!fileValid || !pathValid || !errorValid || !folderValid) {
            return context.code(414);
        }

        const spaPath = join(data.folder, data.file);
        const fullPath = join(data.folder, data.path);
        const errorPath = join(data.folder, data.error);

        if (
            !spaPath.startsWith(data.folder) ||
            !fullPath.startsWith(data.folder) ||
            !errorPath.startsWith(data.folder)
        ) {
            return context.code(403);

            // try {
            //     const stat = statSync(errorPath);
            //     await this.stream(context, errorPath, stat);
            // } catch (e) { /* ignore */ }
            //
            // return;
        }

        try {
            let path = fullPath;
            let stat = statSync(path);

            if (stat.isDirectory()) {
                path = join(path, 'index.html');
                stat = statSync(path);
            }

            if (stat.isFile()) {
                context.code(data.code || 200);
                this.stream(context, path, stat);
            } else if (data.spa === true) {
                context.code(data.code || 200);
                stat = statSync(spaPath);
                this.stream(context, spaPath, stat);
            } else {
                context.code(404);

                try {
                    const stat = statSync(errorPath);
                    this.stream(context, errorPath, stat);
                } catch (e) {
                    /* ignore */
                }
            }
        } catch (error) {
            const fileError = error as NodeJS.ErrnoException;
            if (fileError.code === 'ENOENT' && data.spa) {
                const extension = extname(data.path).slice(1);

                if (!extension || extension === 'html') {
                    context.code(data.code || 200);
                    const stat = statSync(spaPath);
                    this.stream(context, spaPath, stat);
                } else {
                    context.code(404);

                    try {
                        const stat = statSync(errorPath);
                        this.stream(context, errorPath, stat);
                    } catch (e) {
                        /* ignore */
                    }
                }
            } else if (fileError.code === 'ENOENT' || fileError.code === 'EACCES' || fileError.code === 'EPERM') {
                context.code(fileError.code === 'ENOENT' ? 404 : 403);

                try {
                    const stat = statSync(errorPath);
                    this.stream(context, errorPath, stat);
                } catch (e) {
                    /* ignore */
                }
            } else {
                throw error;
            }
        }

        if (data.code) {
            context.code(data.code);
        }
    }

    handle(context: Context) {
        return this.method.bind(this, context);
    }
}
