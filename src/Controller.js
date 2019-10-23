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

    // async plugin (plugin) {
    // mabye loop through plugins
    //     const { handler } = typeof plugin === 'function' ? { handler: plugin } : plugin;
    //     if (!handler) throw new Error('Controller.plugin - handler required');
    //     this.plugins.push({ handler, plugin });
    // }

    async server (server) {
        // Array.prototype.push.apply(server.plugins, this.plugins);
        this.servers.push(server);
    }

    async client (client) {
        // Array.prototype.push.apply(client.plugins, this.plugins);
        this.clients.push(client);
    }

    async open () {
        return Promise.all([
            Promise.all(this.servers.map(server => server.open())),
            Promise.all(this.clients.map(client => client.open()))
        ]);
    }

    async close () {
        return Promise.all([
            Promise.all(this.servers.map(server => server.close())),
            Promise.all(this.clients.map(client => client.close()))
        ]);
    }

}
