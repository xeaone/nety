'use strict';

const mime = require('./mime.js');
const status = require('./status.js');
const Controller = require('./controller.js');
const HttpServer = require('./http/server/index.js');

Object.assign(HttpServer, {
    Server: require('./http/server/index.js'),
    Auth: require('./http/server/plugin/auth.js'),
    Basic: require('./http/server/plugin/basic.js'),
    Cache: require('./http/server/plugin/cache.js'),
    Compress: require('./http/server/plugin/compress.js'),
    Cookie: require('./http/server/plugin/cookie.js'),
    Normalize: require('./http/server/plugin/normalize.js'),
    Payload: require('./http/server/plugin/payload.js'),
    Preflight: require('./http/server/plugin/preflight.js'),
    Router: require('./http/server/plugin/router.js'),
    Session: require('./http/server/plugin/session.js'),
    Static: require('./http/server/plugin/static.js'),
});

module.exports = {
    Controller,
    HttpServer,
    mime,
    status,
}
