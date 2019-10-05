
'use strict';


module.exports = {
    name: 'cache',
    value: async function (option) {

        if (typeof option !== 'object') {
            option = { control: option };
        }

        if (typeof option.control === 'string') {
            this.context.head['cache-control'] = option.control;
        } else if (typeof option.control === 'number') {
            this.context.head['cache-control'] = `max-age=${option.control}`;
        } else if (typeof option.control === 'boolean') {
            this.context.head['cache-control'] = option.control ? 'max-age=3600' : 'no-cache';
        }

        return this.context;
    }

};
