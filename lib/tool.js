'use strict';

const Utility = require('./utility.js');
const Head = require('./tools/head.js');
const Auth = require('./tools/auth.js');
const Basic = require('./tools/basic.js');
const Status = require('./tools/status.js');
const Static = require('./tools/static.js');
const Session = require('./tools/session.js');
const Redirect = require('./tools/redirect.js');

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
        self.tools
    );

    for (const tool of tools) {
        let value;

        if (!tool) {
            throw new Error('tool required');
        }

        let name = Utility.toCamelCase(tool.name);

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

        if (value.ctx) throw new Error('reserved tool property ctx');
        if (value.context) throw new Error('reserved tool property context');
        if (value.instance) throw new Error('reserved tool property instance');

        Object.defineProperty(value, 'instance', {
            value: self,
            enumerable: true
        });

        Object.defineProperty(value, 'context', {
            enumerable: true,
            get: function () { return this.context; }
        });

        properties[name] = {
            value: value,
            enumerable: true
        };
    }

    properties.context = {
        enumerable: true,
        get () { return this.ctx; }
    };

    Object.defineProperty(self, 'tool', {
        value: {},
        enumerable: true
    });

    Object.defineProperties(self.tool, properties);
};
