const Http2 = require('http2');
const Fs = require('fs');

const {
    HTTP2_HEADER_METHOD,
    HTTP2_HEADER_PATH,
    HTTP2_HEADER_STATUS,
    HTTP2_HEADER_CONTENT_TYPE
} = Http2.constants;

const option = {
    allowHTTP1: true,
    cert: Fs.readFileSync(`${__dirname}/localhost-cert.pem`),
    key: Fs.readFileSync(`${__dirname}/localhost-privkey.pem`)
};

const server = Http2.createSecureServer(option);

server.on('error', console.error);

server.on('stream', function (stream, headers) {
    const method = headers[HTTP2_HEADER_METHOD];
    const path = headers[HTTP2_HEADER_PATH];

    console.log(path);

    stream.on('error', console.error);

    stream.respond({
        [HTTP2_HEADER_STATUS]: 200,
        [HTTP2_HEADER_CONTENT_TYPE]: 'text/html'
    });

    stream.end('<h1>Hello World</h1>');

});

server.listen(8000);
console.log('http2 server listening on https://localhost:8000/');
