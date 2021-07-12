[![Total alerts](https://img.shields.io/lgtm/alerts/g/vokeio/nety.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/vokeio/nety/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/vokeio/nety.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/vokeio/nety/context:javascript)

# Nety
Server module for building API, SPA, and WEB applications. Zero dependencies.

## Overview
Single page application mode all request will check to see if the requested path exists on the file system.
Otherwise it will serve the default file `index.html`. See the test directory for more advanced examples.

<!-- ## API
Api documentation can be found at [API.md](https://github.com/vokeio/nety/blob/master/API.md) -->

## Features
- async/await
- static files server
- built in auth handling
- no external dependencies
- spa/single page application
	- redirects all urls with out extensions and wih .html to the root file

## Install
`npm i nety --save`

## Example
```js
const Nety = require('../src');
const { Controller, HttpServer } = Nety;
const { Server, Basic, Cache, Cookie, File, Payload, Normalize, Preflight, Session } = HttpServer;

const validate = async (context, username, password) => {
    if (username !== 't' || password !== 't') {
        return { valid: false };
    } else {
        return { valid: true };
    }
};

const file = new File();
const cache = new Cache();
const cookie = new Cookie();
const payload = new Payload();
const normalize = new Normalize();
const preflight = new Preflight();
const basic = new Basic({ validate, secret });

const server = new Server({
    port: 8080,
    // version: 2, http2 experimental
    debug: true,
    host: 'localhost'
});

await server.add(normalize);
await server.add(preflight);
await server.add(cache);
await server.add(cookie);
await server.add(payload);
await server.add(basic);
await server.add(file);

await server.get('/', async context => {
    context.type('html').body(`<h2>Hello World<h1>`).end();
});

await server.get(async context => {
    return context.file({
        spa: true,
        folder: './static',
        path: context.url.pathname
    });
});

await server.open();

console.log(`Host: ${server.host}, Address: ${server.address}, Port: ${server.port}`)
```

## Authors
[Alexander Elias](https://github.com/vokeio)

## License
[Why You Should Choose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
This project is licensed under the MPL-2.0 License
