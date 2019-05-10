'use strict';

module.exports = {
    name: 'auth',
    value: async function (option) {

        if (!option || typeof option !== 'object') {
            return { code: 500, message: 'auth option object required' };
        }

        let credential;
        const tool = this.context.tool[option.tool] || {};
        const realm = option.realm || tool.realm;
        const scheme = option.scheme || tool.scheme;
        const validate = option.validate || tool.validate;
        const strategy = option.strategy || tool.strategy;

        if (typeof validate !== 'string' && typeof validate !== 'function') {
            return { code: 500, message: 'auth validate string or function required' };
        }

        if (typeof strategy !== 'string' && typeof strategy !== 'function') {
            return { code: 500, message: 'auth strategy string or function required' };
        }

        if (typeof validate === 'string' && !(validate in this.tool)) {
            return { code: 500, message: 'auth validate not found in tools' };
        }

        if (typeof strategy === 'string' && !(strategy in this.tool)) {
            return { code: 500, message: 'auth strategy not found in tools' };
        }

        if (typeof realm !== 'string') {
            return { code: 500, message: 'auth realm string required' };
        }

        if (typeof scheme !== 'string') {
            return { code: 500, message: 'auth scheme string required' };
        }

        const cookie = this.context.request.headers['Cookie'] || this.context.request.headers['cookie'];
        const authorization = this.context.request.headers['Authorization'] || this.context.request.headers['authorization'];

        if (!authorization && !cookie) {
            this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
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
                this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
                return { code: 401,  message: 'authorization scheme invalid' };
            }

        } else if (authorization) {
            const pattern = new RegExp(scheme, 'i');

            if (!authorization.match(pattern)) {
                this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
                return { code: 401,  message: 'authorization scheme invalid' };
            }

            credential = authorization.replace(pattern, '').replace(/\s/g, '');
        }

        if (!credential) {
            this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
            return { code: 401, message: 'authorization credential required' };
        }

        // Strategy Start
        const strategyOptions = Object.assign(option, { tool, realm, scheme, validate, strategy });
        const strategyResult = await strategy(this.context, credential, strategyOptions);

        if (!strategyResult || typeof strategyResult !== 'object') {
            return { code: 500, message: 'auth strategy object required' };
        }

        if (!strategyResult.valid) {
            this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
            return { code: 401, message: strategyResult.message || 'auth strategy invalid credential' };
        }

        if (!strategyResult.credential || typeof strategyResult.credential !== 'object') {
            return { code: 500, message: 'auth strategy credential object required' };
        }

        credential = strategyResult.credential;
        // Strategy End

        // Validate Start
        const validateOptions = Object.assign(option, { tool, realm, scheme, validate, strategy });
        const validateResult = await validate(this.context, credential, validateOptions);

        if (!validateResult || typeof validateResult !== 'object') {
            return { code: 500, message: 'auth validate object required' };
        }

        if (!validateResult.valid) {
            this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
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
