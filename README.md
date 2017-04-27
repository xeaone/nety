# Servey
A small but powerful static and single page application server. Currently Servey is only meant to be a development server. In the future it will be capable of production. But right now I do not think it is safe for production.


## Spa Mode
All request will check to see if the path exists on the file system, if it does exists on file system then it will serve the index.html, unless the request contained an extension it will the respond with a 404.

- path does not exists and has an extension then a 404 is served.
- path does not exists and does not have an extension then the `/index.html` is served.
- path does exists and has an extension then that the `path.extension` is served.
- path does exists and does not have an extension then the `path/index.html` is served.


## API

### Servey(Object: options)
Returns a server instance.

#### options
- `Number: port` port to use.
- `String: hostname` hostname to use.
- `Boolean: spa` spa mode defaults to false.
- `String: directory` path to static directory.


### server.listen(Function: callback)
A Servey server instance has a listen function which starts the server.
