'use strict';

module.exports = class Router {

    constructor (options = {}) {
        this.vhost = options.vhost || '';
        this.routes = options.routes || {};
    }

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
    }

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
    }

    async handle (context) {
        const routes = this.routes;
        const requestMethod = context.method;
        const requestPath = context.url.pathname;

        if (this.vhost && this.vhost !== context.url.host) {
            return;
        }

        for (const route of routes) {
            if (this.compareMethod(route.method, requestMethod) && this.comparePath(route.path, requestPath)) {
                return route.handler(context);
            }
        }

        // for (const name in routes) {
        //
        //     const route = routes[name];
        //     const handler = route.handler || route;
        //     const parts = name.trim().replace(/\s+/g, ' ').split(' ');
        //     const responsePath = typeof route === 'function' ? (parts[1] || parts[0]) : route.path;
        //     const responseMethod = typeof route === 'function' ? (parts.length === 1 ? '*' : parts[0]) : route.method;
        //
        //     if (this.compareMethod(responseMethod, requestMethod) && this.comparePath(responsePath, requestPath)) {
        //         return handler(context);
        //     }
        //
        // }

    }

}
