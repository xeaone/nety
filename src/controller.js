'use strict';

module.exports = class Controller {

    constructor (options = {}) {
        this.handles = options.handles || [];
        this.plugins = options.plugins || [];

        this.options = { ...options };
        delete this.options.handles;
        delete this.options.plugins;

    }

    async plugin (plugin) {
        plugin = typeof plugin === 'function' ? { handle: plugin } : plugin;
        this.plugins.push(plugin);
        this.handles.forEach(handle => handle.plugins.push(plugin));
    }

    async handle (handle) {
        Array.prototype.push.apply(handle.plugins, this.plugins);
        Object.assign(handle, this.options);
        this.handles.push(handle);
    }

    async open () {
        return Promise.all(this.handles.map(handle => handle.open()));
    }

    async close () {
        return Promise.all(this.handles.map(handle => handle.close()));
    }

}
