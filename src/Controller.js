'use strict';

// const Events = require('events');

const Http = require('http');
const Https = require('https');
const Http2 = require('http2');

module.exports = class Controller {

    constructor ( options = {} ) {
        this.debug = options.debug || false;
        this.plugins = options.plugins || [];
        this.servers = options.servers || [];
        this.clients = options.clients || [];
    }

    async plug () {
        const plugins = this.plugins;
        for (const plugin of plugins) {

            if (context.response.closed || context.response.aborted || context.response.destroyed || context.response.writableEnded) {
                break;
            } else {
                await (handler.handler || handler).call(handler, context);
            }

        }
    }

    async plugin (plugin) {
        const { handler } = typeof plugin === 'function' ? { handler: plugin } : plugin;
        if (!handler) throw new Error('Controller.plugin - handler required');
        this.plugins.push({ handler, plugin });
    }

    async server (server) {
        const self = this;
        const { type, path, port, host, handler, options } = server;

        if (!type) throw new Error('Controller.server - type required');
        if (!handler) throw new Error('Controller.server - handler required');
        if (typeof path !== 'string' && typeof port !== 'number') throw new Error('Controller.server - port or path required');
        if (!(['net','http','https','http2','https2'].includes(type))) throw new Error('Controller.server - type invalid');

        const handle = function () {
            Promise.resolve().then(() => handler.apply(server, [self].concat(arguments))).catch(error => { throw error; });

            // handler.apply(server, [self].concat(arguments));
            // handler.apply(server, [self].concat(arguments)).catch(error => { throw error; });
            // Promise.resolve().then(() => handler.apply(server, [self].concat(arguments))).catch(error => { throw error; });
            // try {
            // } catch (e) {
            //     console.log(e);
            //     throw 'stop'
            // }
        };

        let listener;
        switch (type) {
            // case 'net': listener = Net.createServer(options, handler.bind(server, this)); break;
            // case 'http': listener = Http.createServer(options, handler.bind(server, this)); break;
            case 'http': listener = Http.createServer(options, handle); break;
            case 'https': listener = Https.createServer(options, handler.bind(server, this)); break;
            case 'http2': listener = Http2.createServer(options, handler.bind(server, this)); break;
            case 'https2': listener = Http2.createSecureServer(options, handler.bind(server, this)); break;
            default: listener = Net.createServer(options, handler.bind(server, this));
        }

        // listener.on('error', error => { throw error; });
        this.servers.push({ type, path, port, host, listener });
    }

    async open () {
        return Promise.all(this.servers.map(server => new Promise(resolve => {
            const { path, port, host } = server;
            server.listener.listen(path || port, path ? undefined : host, () => {
                if (path) {
                    server.path = server.listener.address();
                 } else {
                    const info = server.listener.address();
                    server.port = info.port;
                    server.family = info.family;
                    server.address = info.address;
                    server.host = host || info.address;
                }
                resolve();
            });
        })));
    }

    async close () {
        return Promise.all(this.servers.map(server => new Promise(resolve => {
            server.listener.close(() => {
                resolve();
            });
        })));
    }

}
