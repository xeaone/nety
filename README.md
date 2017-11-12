
# Servey
A static and single page application (spa) server

## Overview
A small but powerful static and single page application server. Uses async/await.

### Install
`npm i servey --save`

### SPA
All request will check to see if the path exists on the file system, Otherwise it will serve the default file (index.html).

## API

### Servey.servers
An Array of serves.

### Servey.create(options)
Returns a server instance. Inherits Node.js Http.Server class.
- `options: Object`
	- `port: Number` port to use (default: `0`)
	- `spa: Boolean` spa mode (defaults: `false`)
	- `cors: Boolean` cors mode (defaults: `false`)
	- `host: String` host to use (default: `0.0.0.0`)
	- `folder: String` path to (defaults: `./public`)
	- `secure: Boolean` http or https (default: `false`)
	- `file: String` path to default file (default: `index.html`)
- `open: Function` Returns async function and starts listening.
- `close: Function` Returns async function and stops listening.

## Authors
[AlexanderElias](https://github.com/AlexanderElias)

## License
[Why You Should Choose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
This project is licensed under the MPL-2.0 License
