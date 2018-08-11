
# API

### Servey: Class
Inherits Events and returns a server instance.
- `options: Object`
	- `tools: Array` A list of tools that will be available in the handlers.
	- `port: Number` port to use (default: `0`)
	- `cors: Boolean, Object` cors mode (defaults: `false`)
		- `origin: String` Access-Control-Allow-Origin
		- `methods: String` Access-Control-Allow-Methods
		- `headers: String` Access-Control-Allow-Headers
		- `requestMethod: String` Access-Control-Request-Method
	- `host: String` host to use (default: `0.0.0.0`)
	- `secure: Boolean` http or https (default: `false`)
	- `debug: Boolean` sends error message (default: `false`)
	- `routes: Array`
		- `route: Object`
			- `options: Object`
				- `auth: Object`
					- `type: String` Cookie or any HTTP Authorization header such as Basic or Bearer.
					- `strategy: String, Function` A name to a `Servey.tool` property. Must return an Object with a `valid: Boolean` and `credential: Object` property.
			- `handler: AsyncFunction`
				- `context: Object`
					- `body: Any`
					- `tool: Object`
					- `code: Number`
					- `head: Object`
					- `query: Object`
					- `method: String`
					- `url: Object` Url
					- `credential: Object`
					- `request: Class` Http.ServerRequest
					- `response: Class` Http.ServerResponse
					- `instance: Class` Servey
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
