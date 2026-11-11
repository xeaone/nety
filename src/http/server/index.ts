import Os from 'node:os';
import Http from 'node:http';
import Https from 'node:https';
import Http2 from 'node:http2';
import type { Server as NetServer } from 'node:net';

import Mime from '../../mime.js';
import Status from '../../status.js';
import Methods from '../../methods.js';

import Context from './context.js';

import type { Condition, Handle, RegisteredHandle, Request, Response } from './types.js';

export interface HttpServerOptions {
    port?: number;
    debug?: boolean;
    host?: string;
    address?: string;
    type?: string;
    encoding?: BufferEncoding;
    server?: Record<string, unknown>;
    version?: 1 | 2;
    handles?: RegisteredHandle[];
    secure?: boolean | Record<string, unknown>;
    end?: boolean;
    xss?: string;
    xframe?: string;
    xcontent?: string;
    xdownload?: string;
    hsts?: string;
}

/**
 * Class for an Http Server.
 */

export default class HttpServer {
    family: string | null = null;
    type: string | undefined = undefined;
    encoding: BufferEncoding | undefined = undefined;
    server: Record<string, unknown> = {};
    debug = false;
    version: 1 | 2 = 1;
    secure: boolean | Record<string, unknown> = false;
    host = Os.hostname() || 'localhost';
    address = '0.0.0.0';
    end = true;

    xss: string | undefined = '1; mode=block';
    xframe: string | undefined = 'SAMEORIGIN';
    xcontent: string | undefined = 'nosniff';
    xdownload: string | undefined = 'noopen';
    hsts: string | undefined = 'max-age=31536000; includeSubDomains; preload';

    listener!: NetServer;

    port = 0;
    handles: RegisteredHandle[] = [];

    get mime() {
        return Mime;
    }
    get status() {
        return Status;
    }
    get methods() {
        return Methods;
    }

    /**
     * Create an Http Server.
     * @param {Object} options Options
     * @param {Number} [options.port=0] - Port number
     * @param {Boolean} [options.debug=false] - Debug mode
     * @param {Boolean} [options.host=Os.hostname||'localhost'] - Host name
     */

    constructor(options: HttpServerOptions = {}) {
        this.type = options.type;
        this.port = options.port || 0;
        this.encoding = options.encoding;
        this.server = options.server || this.server;
        this.debug = options.debug || false;
        this.version = options.version || 1;
        this.handles = options.handles || [];
        this.secure = options.secure || false;
        this.host = options.host || this.host;
        this.address = options.address || options.host || this.address;
        this.end = typeof options.end === 'boolean' ? options.end : true;

        this.xss = options.xss || this.xss;
        this.xframe = options.xframe || this.xframe;
        this.xcontent = options.xcontent || this.xcontent;
        this.xdownload = options.xdownload || this.xdownload;
        this.hsts = options.hsts || this.hsts;

        if (this.version === 2) this.server.allowHTTP1 = true;
        if (typeof this.secure === 'object') Object.assign(this.server, this.secure);

        if (this.version === 1 && !this.secure) {
            this.listener = Http.createServer(this.server as Http.ServerOptions, this.handle.bind(this));
        } else if (this.version === 1 && this.secure) {
            this.listener = Https.createServer(this.server as Https.ServerOptions, this.handle.bind(this));
        } else if (this.version === 2 && !this.secure) {
            this.listener = Http2.createServer(this.server as Http2.ServerOptions, this.handle.bind(this));
        } else if (this.version === 2 && this.secure) {
            this.listener = Http2.createSecureServer(this.server as Http2.SecureServerOptions, this.handle.bind(this));
        }
    }

    async handle(request: Request, response: Response) {
        if (this.xss) response.setHeader('x-xss-protection', this.xss);
        if (this.xframe) response.setHeader('x-frame-options', this.xframe);
        if (this.hsts) response.setHeader('strict-transport-security', this.hsts);
        if (this.xdownload) response.setHeader('x-download-options', this.xdownload);
        if (this.xcontent) response.setHeader('x-content-type-options', this.xcontent);

        try {
            const instance = this;
            const context = new Context({ request, response, instance });
            const handles = this.handles;

            for (const { handle, name, method, pattern } of handles) {
                if (response.writableEnded) {
                    break;
                } else {
                    if (method !== '*' && method !== context.method) continue;
                    if (!pattern.test(context.url)) continue;
                    const action = 'handle' in handle ? handle.handle : handle;
                    const result = await action(context);
                    if (name && result) context.set(name, result);
                }
            }

            if (!response.writableEnded && this.end) {
                return context.end();
            }
        } catch (error) {
            const serverError = error instanceof Error ? error : new Error(String(error));

            const code = 'code' in serverError && typeof serverError.code === 'number' ? serverError.code : 500;
            const message =
                'message' in serverError && typeof serverError.message === 'string'
                    ? serverError.message
                    : 'Internal Server Error';

            console.error(`${request.method} ${request.url}`);
            console.error(serverError);

            response.statusCode = code;
            response.statusMessage = message;
            response.setHeader('Content-Type', 'application/json');
            response.end(`{ message: ${message} }`);
        }
    }

    add(condition: Condition, handle: Handle): void {
        const pattern = new URLPattern(condition);
        const method = condition.method || '*';

        let name: string;
        name = handle.name || handle.constructor.name;
        name = name === 'Function' ? '' : name;
        name = `${name.charAt(0).toLowerCase()}${name.slice(1)}`;

        this.handles.push({ handle, name, method, pattern });
    }

    use(handle: Handle): void {
        this.add({ method: '*', pathname: '*' }, handle);
    }

    get(path: string, handle: Handle): void {
        this.add({ method: 'get', pathname: path }, handle);
    }

    post(path: string, handle: Handle): void {
        this.add({ method: 'post', pathname: path }, handle);
    }

    put(path: string, handle: Handle): void {
        this.add({ method: 'put', pathname: path }, handle);
    }

    connect(path: string, handle: Handle): void {
        this.add({ method: 'connect', pathname: path }, handle);
    }

    delete(path: string, handle: Handle): void {
        this.add({ method: 'delete', pathname: path }, handle);
    }

    head(path: string, handle: Handle): void {
        this.add({ method: 'head', pathname: path }, handle);
    }

    options(path: string, handle: Handle): void {
        this.add({ method: 'options', pathname: path }, handle);
    }

    patch(path: string, handle: Handle): void {
        this.add({ method: 'patch', pathname: path }, handle);
    }

    trace(path: string, handle: Handle): void {
        this.add({ method: 'trace', pathname: path }, handle);
    }

    any(path: string, handle: Handle): void {
        this.add({ method: '*', pathname: path }, handle);
    }

    /**
     * Starts listening on the port and host.
     * @async
     */

    async open() {
        return new Promise<void>((resolve) => {
            this.listener.listen(this.port, this.address, () => {
                const info = this.listener.address();
                if (!info || typeof info === 'string') throw new Error('Server address is unavailable');
                this.port = info.port;
                this.family = info.family;
                this.address = info.address;
                resolve();
            });
        });
    }

    /**
     * Stops listening on the port and host.
     * @async
     */

    async close() {
        return new Promise<void>((resolve) => {
            this.listener.close(() => {
                resolve();
            });
        });
    }
}
