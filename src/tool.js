'use strict';

const Utility = require('./utility.js');
const Head = require('./tools/head.js');
const Auth = require('./tools/auth.js');
const Basic = require('./tools/basic.js');
const Status = require('./tools/status.js');
const Static = require('./tools/static.js');
const Session = require('./tools/session.js');
const Redirect = require('./tools/redirect.js');
const Compress = require('./tools/compress.js');

module.exports = function Tool (options) {
    const self = this;
    const properties = {};

    const tools = [].concat(
        Head,
        Auth,
        Basic,
        Static,
        Status,
        Session,
        Redirect,
        Compress,
        self.tools
    );

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

    Object.defineProperty(self, 'tool', {
        value: {},
        enumerable: true
    });

    Object.defineProperties(self.tool, properties);
};
