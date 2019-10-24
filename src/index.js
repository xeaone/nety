'use strict';

module.exports = {

    Controller: require('./controller.js'),
    HttpServer: require('./http-server.js'),

    // plugins
    Cache: require('./cache.js'),
    Compress: require('./compress.js'),
    Cookie: require('./cookie.js'),
    Normalize: require('./normalize.js'),
    Payload: require('./payload.js'),
    Prefligh: require('./preflight.js'),
    Router: require('./router.js'),

    // data
    mime: require('./mime.js'),
    status: require('./status.js'),

}
