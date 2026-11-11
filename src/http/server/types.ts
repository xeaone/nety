import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2';
import type { Readable } from 'node:stream';
import type Context from './context.js';

export type Request = IncomingMessage | Http2ServerRequest;
export type Response = ServerResponse | Http2ServerResponse;

export type HeaderValue = string | number | readonly string[];

export type ResponseBody = string | Buffer | Readable | object;

export interface ValidationResult {
    valid?: boolean;
    forbidden?: boolean;
    credential?: unknown;
}

export interface RouteRequest {
    method: string;
    host: string;
    path: string;
}

export interface RoutePattern {
    method: string | string[];
    host: string | string[];
    path: string | string[];
}

export type Methods = 'connect' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'trace' | '*';

export interface Condition extends URLPatternInit {
    method?: Methods;
}

export type HandleFunction = (context: Context) => void | Promise<void>;

export interface HandleInterface {
    name?: string;
    handle: HandleFunction;
}

export type Handle = HandleFunction | HandleInterface;

export interface RegisteredHandle {
    handle: Handle;
    name: string;
    method: Methods;
    pattern: URLPattern;
}
