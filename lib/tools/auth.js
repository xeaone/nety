'use strict';

module.exports = {
    name: 'auth',
    value: async function (context, options) {
        const self = this;

        if (!options || typeof options !== 'object') {
            return { code: 500, message: 'auth options object required' };
        }

        let tool, credential;
        let realm = options.realm;
        let scheme = options.scheme;
        let validate = options.validate;
        let strategy = options.strategy;

        if (typeof options.tool === 'string' && options.tool in self.tool) {
            tool = self.tool[options.tool];
            realm = realm || tool.realm;
            scheme = scheme || tool.scheme;
            validate = validate || tool.validate.bind(tool);
            strategy = strategy || tool.strategy.bind(tool);
        }

        if (typeof validate !== 'string' && typeof validate !== 'function') {
            return { code: 500, message: 'auth validate string or function required' };
        }

        if (typeof strategy !== 'string' && typeof strategy !== 'function') {
            return { code: 500, message: 'auth strategy string or function required' };
        }

        if (typeof validate === 'string' && !(validate in self.tool)) {
            return { code: 500, message: 'auth validate not found in tools' };
        }

        if (typeof strategy === 'string' && !(strategy in self.tool)) {
            return { code: 500, message: 'auth strategy not found in tools' };
        }

        if (typeof realm !== 'string') {
            return { code: 500, message: 'auth realm string required' };
        }

        if (typeof scheme !== 'string') {
            return { code: 500, message: 'auth scheme string required' };
        }

        const cookie = context.request.headers['Cookie'] || context.request.headers['cookie'];
        const authorization = context.request.headers['Authorization'] || context.request.headers['authorization'];

        if (!authorization && !cookie) {
            context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
            return { code: 401, message: 'authorization header required' };
        } else if (cookie) {
            const items = cookie.split(/\s*;\s*/);

            for (const item of items) {
                const parts = item.split(/\s*=\s*/);
                const name = parts[0];

                if (name === scheme) {
                    credential = decodeURI(parts[1]);
                    break;
                }

            }

            if (!credential) {
                context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
                return { code: 401,  message: 'authorization scheme invalid' };
            }

        } else if (authorization) {
            const pattern = new RegExp(scheme, 'i');

            if (!authorization.match(pattern)) {
                context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
                return { code: 401,  message: 'authorization scheme invalid' };
            }

            credential = authorization.replace(pattern, '').replace(/\s/g, '');
        }

        if (!credential) {
            context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
            return { code: 401, message: 'authorization credential required' };
        }

        // Strategy Start
        const strategyOptions = Object.assign(options, { tool, realm, scheme, validate, strategy });
        const strategyResult = await strategy(context, credential, strategyOptions);

        if (!strategyResult || typeof strategyResult !== 'object') {
            return { code: 500, message: 'auth strategy object required' };
        }

        if (!strategyResult.valid) {
            context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
            return { code: 401, message: strategyResult.message || 'auth strategy invalid credential' };
        }

        if (!strategyResult.credential || typeof strategyResult.credential !== 'object') {
            return { code: 500, message: 'auth strategy credential object required' };
        }

        credential = strategyResult.credential;
        // Strategy End

        // Validate Start
        const validateOptions = Object.assign(options, { tool, realm, scheme, validate, strategy });
        const validateResult = await validate(context, credential, validateOptions);

        if (!validateResult || typeof validateResult !== 'object') {
            return { code: 500, message: 'auth validate object required' };
        }

        if (!validateResult.valid) {
            context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
            return { code: 401, message: validateResult.message || 'auth validate invalid credential' };
        }

        if (!validateResult.credential || typeof validateResult.credential !== 'object') {
            return { code: 500, message: 'auth validate credential object required' };
        }

        credential = validateResult.credential;
        // Validate End

        return { code: 200, credential };
    }
};
