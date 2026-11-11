import { extname } from 'node:path';
import { URL as Url } from 'node:url';
import { Readable, Writable } from 'node:stream';

import Mime from '../../mime.js';
import Status from '../../status.js';
import type { ResponseBody, Request, Response } from './types.js';

export interface ContextOptions {
    request: Request;
    response: Response;
    instance: {
        secure: boolean | object;
        host: string;
        type?: string;
        encoding?: BufferEncoding;
    };
    secure?: boolean;
    host?: string;
    type?: string;
    encoding?: BufferEncoding;
}

const headerValue = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

export default class Context {
    [key: string]: unknown;

    _body: ResponseBody | null = null;
    _secure: boolean | object = false;
    _host = '';
    _type = 'default';
    _encoding: BufferEncoding = 'utf8';
    request!: Request;
    response!: Response;
    instance!: ContextOptions['instance'];
    headers: Record<string, string | string[] | undefined> = {};
    path = '';
    scheme = 'http';
    method = 'get';
    authority = '';
    url = new Url('http://localhost/');

    get mime() {
        return Mime;
    }
    get status() {
        return Status;
    }

    constructor(options: ContextOptions) {
        const request = options.request;
        const response = options.response;
        const instance = options.instance;

        this._secure = options.secure || instance.secure || this._secure;
        this._host = options.host || instance.host || this._host;
        this._type = options.type || instance.type || this._type;
        this._encoding = options.encoding || instance.encoding || this._encoding;

        const headers = Object.freeze({ ...request.headers });
        const method = (headerValue(request.headers[':method']) || request.method || 'GET').toLowerCase();
        const requestPath = headerValue(request.headers[':path']) || request.url || '/';
        const pathMatch = requestPath.match(/(^\/+)?(.*)/) || [];
        const prefix = pathMatch[1] || '';
        const path = pathMatch[2] || '';
        const scheme = (headerValue(request.headers[':scheme']) || (this._secure ? 'https' : 'http')).toLowerCase();

        const authority = (
            headerValue(request.headers[':authority']) ||
            headerValue(request.headers['host']) ||
            this._host
        ).toLowerCase();

        const url = new Url(`${path}`, `${scheme}://${authority}${prefix || '/'}`);

        Object.defineProperties(this, {
            request: { enumerable: true, value: request },
            response: { enumerable: true, value: response },
            instance: { enumerable: true, value: instance },
            headers: { enumerable: true, value: headers },
            path: { enumerable: true, value: path },
            scheme: { enumerable: true, value: scheme },
            method: { enumerable: true, value: method },
            authority: { enumerable: true, value: authority },
            url: { enumerable: true, value: url },
        });
    }

    /**
     * Defines a property on the context.
     * @param {String} name - name of property
     * @param {Any} value - value of property
     */

    set<T>(name: string, value: T): void {
        if (name in this) return;
        const enumerable = true;
        const property = { enumerable, value };
        Object.defineProperty(this, name, property);
    }

    /**
     * Sets the content-type header using a file type.
     * @param {String} [type] - the file type.
     * @returns {Context|String} - Return the context instance for chaining if the type param is provided or the value of content-type header.
     */

    type(type?: string): this | string | number | string[] | undefined {
        if (type) {
            const mime = this.mime[type] || this.mime[this._type];
            this.response.setHeader('content-type', `${mime};charset=${this._encoding}`);
            return this;
        } else {
            return this.response.getHeader('content-type');
        }
    }

    head(name: string): string | number | string[] | undefined;
    head(name: string, value: string | number | readonly string[] | null): this;
    head(
        name: string,
        value?: string | number | readonly string[] | null,
    ): this | string | number | string[] | undefined {
        if (value === undefined) {
            return this.response.getHeader(name);
        } else {
            if (value === '' || value === null) {
                this.response.removeHeader(name);
            } else {
                this.response.setHeader(name, value);
            }
            return this;
        }
    }

    code(): number;
    code(code: number): this;
    code(code?: number): this | number {
        if (code) {
            this.response.statusCode = code;
            return this;
        } else {
            return this.response.statusCode;
        }
    }

    body(): ResponseBody | null;
    body(body: ResponseBody): this;
    body(body?: ResponseBody): this | ResponseBody | null {
        if (body) {
            this._body = body;
            return this;
        } else {
            return this._body;
        }
    }

    end(body?: ResponseBody): Promise<void> {
        return new Promise((resolve, reject) => {
            const code = this.response.statusCode || 200;
            const message = this.status[code] || '';
            const responseBody = body || this._body || message;

            if (!this.response.hasHeader('content-type')) {
                const path = this.url.pathname;
                const extension = extname(path).slice(1);

                if (extension) {
                    const mime = this.mime[extension] || this.mime[this._type];
                    this.response.setHeader('content-type', `${mime};charset=${this._encoding}`);
                }
            }

            if (responseBody instanceof Readable) {
                return new Promise<void>((resolve, reject) =>
                    responseBody
                        .pipe(this.response as unknown as Writable)
                        .on('error', reject)
                        .on('end', resolve),
                );
            } else {
                let data: string | Buffer;
                if (typeof responseBody === 'string' || Buffer.isBuffer(responseBody)) {
                    data = responseBody;
                    if (!this.response.hasHeader('content-type')) {
                        this.response.setHeader('content-type', `${this.mime[this._type]};charset=${this._encoding}`);
                    }
                } else {
                    data = JSON.stringify(responseBody) || '';
                    if (!this.response.hasHeader('content-type')) {
                        this.response.setHeader('content-type', `${this.mime['json']};charset=${this._encoding}`);
                    }
                }

                this.response.setHeader('content-length', Buffer.byteLength(data));
                (this.response.write as (chunk: string | Buffer) => boolean)(data);
            }

            return this.response.end();
        });
    }
}
