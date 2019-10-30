'use strict';

module.exports = class Controller {

    constructor (options = {}) {
        this.handles = options.handles || [];
        this.listener = options.listener || [];

        this.options = { ...options };

        delete this.options.handles;
        delete this.options.listeners;

    }

    async add (handle) {
        this.listeners.forEach(listener => listener.add(handle));
    }

    async listener (listener) {
        Array.prototype.push.apply(listener.handles, this.handles);
        Object.assign(listener, this.options);
        this.listeners.push(listener);
    }

    async open () {
        return Promise.all(this.handles.map(handle => handle.open()));
    }

    async close () {
        return Promise.all(this.handles.map(handle => handle.close()));
    }

}
