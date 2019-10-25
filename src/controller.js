'use strict';

module.exports = class Controller {

    constructor (options = {}) {
        this.handles = options.handles || [];
        this.plugins = options.plugins || [];

        this.options = { ...options };
        delete this.options.handles;
        delete this.options.plugins;

    }

    async unplug () {

    }

    async plugin (plugin) {
        if (typeof plugin === 'function') {
            plugin = { handle: plugin, name: plugin.name };
        } else {
            plugin.name = plugin.name || plugin.constructor.name;
        }

        if (!plugin.name) throw new Error('plugin - plugin name required');
        plugin.name = `${plugin.name.charAt(0).toLowerCase()}${plugin.name.slice(1)}`;
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
