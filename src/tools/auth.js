'use strict';

module.exports = {
    name: 'auth',
    value: async function (option) {

        if (!option || typeof option !== 'object') {
            this.context.code = 500;
            this.context.message = 'auth option object required';
            return this.context;
        }

        let credential;
        const tool = this.context.tool[option.tool] || {};
        const realm = option.realm || tool.realm;
        const scheme = option.scheme || tool.scheme;
        const validate = option.validate || tool.validate;
        const strategy = option.strategy || tool.strategy;

        if (typeof validate !== 'string' && typeof validate !== 'function') {
            this.context.code = 500;
            this.context.message = 'auth validate string or function required';
            return this.context;
        }

        if (typeof strategy !== 'string' && typeof strategy !== 'function') {
            this.context.code = 500;
            this.context.message = 'auth strategy string or function required';
            return this.context;
        }

        if (typeof validate === 'string' && !(validate in this.tool)) {
            this.context.code = 500;
            this.context.message = 'auth validate not found in tools';
            return this.context;
        }

        if (typeof strategy === 'string' && !(strategy in this.tool)) {
            this.context.code = 500;
            this.context.message = 'auth strategy not found in tools';
            return this.context;
        }

        if (typeof realm !== 'string') {
            this.context.code = 500;
            this.context.message = 'auth realm string required';
            return this.context;
        }

        if (typeof scheme !== 'string') {
            this.context.code = 500;
            this.context.message = 'auth scheme string required';
            return this.context;
        }

        const cookie = this.context.request.headers['Cookie'] || this.context.request.headers['cookie'];
        const authorization = this.context.request.headers['Authorization'] || this.context.request.headers['authorization'];

        if (!authorization && !cookie) {
            this.context.code = 401;
            this.context.message = 'authorization header required';
            this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
            return this.context;
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
                this.context.code = 401;
                this.context.message = 'authorization scheme invalid';
                this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
                return this.context;
            }

        } else if (authorization) {
            const pattern = new RegExp(scheme, 'i');

            if (!authorization.match(pattern)) {
                this.context.code = 401;
                this.context.message = 'authorization scheme invalid';
                this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
                return this.context;
            }

            credential = authorization.replace(pattern, '').replace(/\s/g, '');
        }

        if (!credential) {
            this.context.code = 401;
            this.context.message = 'authorization credential required';
            this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
            return this.context;
        }

        // Strategy Start
        const strategyOptions = Object.assign(option, { tool, realm, scheme, validate, strategy });
        const strategyResult = await strategy(credential, strategyOptions);

        if (!strategyResult || typeof strategyResult !== 'object') {
            this.context.code = 500;
            this.context.message = 'auth strategy object required';
            return this.context;
        }

        if (!strategyResult.valid) {
            this.context.code = 401;
            this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
            this.context.message = strategyResult.message || 'auth strategy invalid credential';
            return this.context;
        }

        if (!strategyResult.credential || typeof strategyResult.credential !== 'object') {
            this.context.code = 500;
            this.context.message = 'auth strategy credential object required';
            return this.context;
        }

        credential = strategyResult.credential;
        // Strategy End

        // Validate Start
        const validateOptions = Object.assign(option, { tool, realm, scheme, validate, strategy });
        const validateResult = await validate(credential, validateOptions);

        if (!validateResult || typeof validateResult !== 'object') {
            this.context.code = 500;
            this.context.message = 'auth validate object required';
            return this.context;
        }

        if (!validateResult.valid) {
            this.context.code = 401;
            this.context.head['WWW-Authenticate'] = `${scheme} realm="${realm}"`;
            this.context.message = validateResult.message || 'auth validate invalid credential';
            return this.context;
        }

        if (!validateResult.credential || typeof validateResult.credential !== 'object') {
            this.context.code = 500;
            this.context.message = 'auth validate credential object required';
            return this.context;
        }

        credential = validateResult.credential;
        // Validate End

        this.context.code = 200;
        this.context.credential = credential;
        return this.context;
    }
};
