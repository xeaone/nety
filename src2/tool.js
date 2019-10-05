'use strict';

module.exports = function (tools) {
    const properties = {};

    for (const tool of tools) {
        let value;

        if (!tool) {
            throw new Error('tool required');
        }

        const name = Utility.toCamelCase(tool.name);

        if (!name) {
            throw new Error('tool name required');
        }

        if (name in properties) {
            throw new Error('tool name duplicate');
        }

        if (typeof tool === 'object') {
            value = tool.value;
        }

        if (typeof tool === 'function') {
            value = new tool((options.tool || {})[name]);
        }

        if (value.context) throw new Error('reserved tool property context');
        if (value.instance) throw new Error('reserved tool property instance');

        properties[name] = {
            enumerable: true,
            get: function () {
                if (typeof value === 'function') {
                    return value.bind({
                        instance: self,
                        context: this.context
                    });
                } else {
                    return Object.create(value, {
                        instance: {
                            value: self,
                            enumerable: true
                        },
                        context: {
                            enumerable: true,
                            value: this.context
                        }
                    });
                }
            }
        };

    }

    return Object.freeze(tools);

    Object.defineProperties(self.tool, properties);
};
