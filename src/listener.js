'use strict';

const Os = require('os');
const Net = require('net');
const Http = require('http');
const Https = require('https');
const Http2 = require('http2');
const Events = require('events');

// module.exports = class Listener extends Events {
module.exports = class Listener {

    constructor (options = { ...options }) {
        // super();

        this.constants = Http2.constants;

        this.port = options.port || 0;
        this.type = options.type || 'http';
        this.hostname = options.hostname || Os.hostname() || 'localhost';

        delete options.type;
        delete options.port;
        delete options.hostname;

        options.allowHTTP1 = 'allowHTTP1' in options ? options.allowHTTP1 : true;

        // switch (this.type) {
        //     case 'net': this.listener = Net.createServer(options, this.emit.bind(this, 'handle')); break;
        //     case 'http': this.listener = Http.createServer(options, this.emit.bind(this, 'handle')); break;
        //     case 'https': this.listener = Https.createServer(options, this.emit.bind(this, 'handle')); break;
        //     case 'http2': this.listener = Http2.createServer(options, this.emit.bind(this, 'handle')); break;
        //     case 'https2': this.listener = Http2.createSecureServer(options, this.emit.bind(this, 'handle')); break;
        // }

        // if (this.type === 'net') {
        //     this.listener.on('connection', this.emit.bind(this, 'handle'));
        // } else {
        //     this.listener.on('request', this.emit.bind(this, 'handle'));
        // }

        // this.listener.on('error', this.emit.bind(this, 'error'));
    }

    async create (hook, error) {

        switch (this.type) {
            case 'net': this.listener = Net.createServer(options, hook); break;
            case 'http': this.listener = Http.createServer(options, hook); break;
            case 'https': this.listener = Https.createServer(options, hook); break;
            case 'http2': this.listener = Http2.createServer(options, hook); break;
            case 'https2': this.listener = Http2.createSecureServer(options, hook); break;
        }

        this.listener.on('error', error);
    }

    async open () {
        return new Promise(resolve => {
            this.listener.listen(this.port, this.hostname, () => {
                this.emit('open');
                resolve();
            });
        });
    }

    async close () {
        return new Promise(resolve => {
            this.listener.close(() => {
                this.emit('close');
                resolve();
            });
        });
    }

}
