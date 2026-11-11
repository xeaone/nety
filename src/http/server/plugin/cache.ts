import type Context from '../context.js';

export interface CacheOptions {
    control?: string | number | boolean;
}

export default class Cache {
    control = 'max-age=3600';

    constructor(options: CacheOptions = {}) {
        const control =
            typeof options.control === 'number'
                ? `max-age=${options.control}`
                : typeof options.control === 'boolean'
                  ? options.control
                      ? this.control
                      : 'no-cache'
                  : options.control;

        if (control !== undefined) Object.assign(this, { control });
    }

    async handle(context: Context) {
        context.head('cache-control', this.control);
    }
}
