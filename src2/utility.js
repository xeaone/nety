'use strict';

const Http = require('http');
const Path = require('path');
const Mimes = require('./mimes.js');

module.exports = {

    mimes: Mimes,
    methods: Http.METHODS,
    messages: Http.STATUS_CODES,

    statusString (code, message) {
        return JSON.stringify({
            code: code,
            message: message || this.messages[code]
        });
    },

    toCamelCase (data) {
        data = data.slice(0, 1).toLowerCase() + data.slice(1);
        return data.replace(/(_+|-+|\s+)([a-zA-z])/g, function (string) {
            return string.slice(-1).toUpperCase();
        });
    },

    compareMethod (routeMethod, userMethod) {

        if (typeof routeMethod === 'string') {
            return routeMethod.toUpperCase() === userMethod.toUpperCase();
        } else {
            for (const method of routeMethod) {
                if (this.compareMethod(method, userMethod)) {
                    return true;
                }
            }
        }

        return false;
    },

    comparePath (routePath, userPath) {

        if (typeof routePath === 'string') {
            const compareParts = [];
            const userParts = userPath.replace(/^\/|\/$/g, '').split(/\/|-/);
            const routeParts = routePath.replace(/^\/|\/$/g, '').split(/\/|-/);

            for (let i = 0, l = routeParts.length; i < l; i++) {

                if (routeParts[i].startsWith('(') && routeParts[i].endsWith(')')) {

                    if (routeParts[i] === '(~)' || routeParts[i] === '(*)') {
                        return true;
                    } else {
                        compareParts.push(userParts[i]);
                    }

                } else if (routeParts[i] !== userParts[i]) {
                    return false;
                } else {
                    compareParts.push(routeParts[i]);
                }

            }

            if (compareParts.join('/') === userParts.join('/')) {
                return true;
            } else {
                return false;
            }

        } else {
            for (const path of routePath) {
                if (this.comparePath(path, userPath)) {
                    return true;
                }
            }
        }

        return false;
    },

    async getMime (data) {
        data = data || '';

        if (data.includes('.')){
            data = Path.extname(data).slice(1);
        }

        return this.mimes[data || 'txt'];
    }
    // assign (target, options, defaults) {
    //
    // 	for (let name in defaults) {
    // 		let property = { enumerable: true };
    //
    // 		if (options[name] === undefined) {
    // 			property.value = defaults[name];
    // 		} else {
    // 			property.value = options[name];
    // 		}
    //
    // 		Object.defineProperty(target, name, property);
    // 	}
    //
    //     return target;
    // },

    // toParameterObject (routePath, userPath) {
    //     let result = {};
    //
    //     if (
    //         !routePath
	// 		|| !userPath
	// 		|| routePath === '/'
	// 		|| userPath === '/'
    //     ) return result;
    //
    //     const userParts = userPath.split(/\/|-/);
    //     const routeParts = routePath.split(/\/|-/);
    //
    //     for (let i = 0, l = routeParts.length; i < l; i++) {
    //         let part = routeParts[i];
    //
    //         if (part.slice(0, 1) === '(' && part.slice(-1) === ')') {
    //             const name = part.slice(1, part.length - 1).replace('~', '');
    //             result[name] = userParts[i];
    //         }
    //
    //     }
    //
    //     return result;
    // }

};
