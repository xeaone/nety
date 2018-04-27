
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

	const options = {
		port: 8080,
		routes: routes,
		hostname: 'localhost',
	};

	const server = new Servey(options);

	server.on('error', function (error) {
		console.error(error);
	});

	server.on('request', function (req) {
		console.log(req.url);
	});

	server.on('open', function () {
		console.log('open');
	});

	server.on('close', function () {
		console.log('close');
	});

	await server.open();
```

## Authors
[AlexanderElias](https://github.com/AlexanderElias)

## License
[Why You Should Choose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
This project is licensed under the MPL-2.0 License
