import Zlib from 'node:zlib';
import Util from 'node:util';
import Stream from 'node:stream';
import type Context from '../context.js';

// const Temporary = Os.tmpdir();
const Gzip = Util.promisify(Zlib.gzip);
const Deflate = Util.promisify(Zlib.deflate);

// console.warn('todo: compres specific files');
// console.warn('todo: cache compressed version');

export default class Compress {
    buffers = new Map<string, Buffer>();

    constructor() {
        throw new Error('compress is not ready');
    }

    async handle(context: Context) {
        // console.log('compress',context.path);

        // if (context.headers.range) return;

        const encodingHeader = context.headers['accept-encoding'];
        const encoding = Array.isArray(encodingHeader) ? encodingHeader.join(',') : encodingHeader;

        if (!encoding) return;

        const body = context.body();
        const encodings = encoding.split(/\s*,\s*/);

        if (encodings.includes('deflate')) {
            // context.head('transfer-encoding', 'chunked');

            if (typeof body === 'string') {
                // context.head('content-length', '');
                context.head('content-encoding', 'deflate');
                // context.head('transfer-encoding', 'deflate');
                context.body(await Deflate(body));
            } else if (body instanceof Stream) {
                // context.head('content-length', '');
                context.head('content-encoding', 'deflate');
                // context.head('transfer-encoding', 'deflate');
                context.body(body.pipe(Zlib.createDeflate()));
            }
        } else if (encodings.includes('gzip')) {
            // context.head('transfer-encoding', 'chunked');

            if (typeof body === 'string') {
                // context.head('content-length', '');
                context.head('content-encoding', 'gzip');
                // context.head('transfer-encoding', 'gzip');
                context.body(await Gzip(body));
            } else if (body instanceof Stream) {
                // context.head('content-length', '');
                context.head('content-encoding', 'gzip');
                // context.head('transfer-encoding', 'gzip');
                context.body(body.pipe(Zlib.createGzip()));
            }
        }
    }
}
