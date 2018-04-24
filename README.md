
# Servey
Servey it up DOG!

## Overview
In single page application mode all request will check to see if the requested path exists on the file system.
Otherwise it will serve the default file `index.html`.

## Features
- api
- async/await
- static files
- spa/single page application

## Install
`npm i servey --save`

## Example
```js
	const Servey = require('servey');

	const routes = [
		{
			path: '*',
			method: 'get',
			handler: async function (req, res) {
				return await this.plugin.static({
					spa: true,
					path: this.path,
					folder: './test/static'
				});
			}
		}
	];

	const server = new Servey({
		port: 8080,
		routes: routes
	});

	server.on('error', function (error) {
		console.error(error);
	});

	server.on('request', function (req) {
		console.log(req.url);
	});

	server.on('open', function () {
		console.log('open');
	});

	await server.open();
```

## API

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
Default server plugins.
- `static` Static file and single page application.
	- `spa: Boolean` spa mode (defaults: `false`)
	- `folder: String` path to (defaults: `./public`)
	- `file: String` path to default file (default: `index.html`)

## Authors
[AlexanderElias](https://github.com/AlexanderElias)

## License
[Why You Should Choose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
This project is licensed under the MPL-2.0 License
