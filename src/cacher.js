'use strict';

module.exports = class Cacher {

    constructor (options) {
        options = options || {};

        if (!options.control) {
            this.control = 'max-age=3600';
        } else if (typeof options.control === 'string') {
            this.control = option.control;
        } else if (typeof option.control === 'number') {
            this.control = `max-age=${option.control}`;
        } else if (typeof option.control === 'boolean') {
            this.control = option.control ? 'max-age=3600' : 'no-cache';
        }

    }

    async handler (context) {
        this.context.head['cache-control'] = this.control;
    }

}
