
# API

### Servey: Class
Inherits Events and returns a server instance.
- `options: Object`
	- `port: Number` port to use (default: `0`)
	- `cors: Boolean, Object` cors mode (defaults: `false`)
		- `origin: String` Access-Control-Allow-Origin
		- `methods: String` Access-Control-Allow-Methods
		- `headers: String` Access-Control-Allow-Headers
		- `requestMethod: String` Access-Control-Request-Method
	- `host: String` host to use (default: `0.0.0.0`)
	- `secure: Boolean` http or https (default: `false`)
	- `routes: Array`
		- `route: Object`
			- `handler: AsyncFunction`
				- `request: `
				- `response: `
				- `context: this`
					- `plugin: Object`
					- `url: Object` Url
					- `path: String` Url.pathname
					- `method: String` Request.method
- `open: AsyncFunction` Starts listening.
- `close: AsyncFunction` Stops listening.
- `on: Function`
	- `open: Event`
	- `close: Event`
	- `error: Event`
	- `request: Event`
	- `response: Event`

### Servey.plugins: Array
Default server plugin.
- `static` Static file and single page application.
	- `spa: Boolean` spa mode (defaults: `false`)
	- `folder: String` path to (defaults: `./public`)
	- `file: String` path to default file (default: `index.html`)
