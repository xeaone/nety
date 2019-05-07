const Fs = require('fs');
const Http = require('http');
// const Path = require('path');
const Zlib = require('zlib');

Http.createServer(function (request, response) {

    const path = './video.mp4';
    const stat = Fs.statSync(path);
    const fileSize = stat.size;
    const range = request.headers.range;

    if (range) {

        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
        const chunksize = (end-start)+1;

        response.writeHead(206, {
            'Accept-Ranges': 'bytes',
            'Content-Type': 'video/mp4',
            'Content-Length': chunksize,
            'Content-Range': `bytes ${start}-${end}/${fileSize}`
        });

        Fs.createReadStream(path, { start, end })
            .pipe(response)
            .on('error', console.error)
            .on('end', function () { console.log('end'); })
            .on('finish', function () { console.log('finish'); });

    } else {

        response.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Encoding': 'gzip',
            'Content-Type': 'video/mp4'
        });

        Fs.createReadStream(path)
            .pipe(Zlib.createGzip())
            .pipe(response);
    }

    // let filePath = '.' + request.url;
    //
    // if (filePath === './') {
    //     filePath = './index.html';
    // }
    //
    // filePath = Path.resolve(filePath);
    //
    // const extname = String(Path.extname(filePath)).toLowerCase();
    //
    // const mime = {
    //     '.html': 'text/html',
    //     '.js': 'text/javascript',
    //     '.css': 'text/css',
    //     '.json': 'application/json',
    //     '.png': 'image/png',
    //     '.jpg': 'image/jpg',
    //     '.gif': 'image/gif',
    //     '.wav': 'audio/wav',
    //     '.mp4': 'video/mp4',
    //     '.woff': 'application/font-woff',
    //     '.ttf': 'application/font-ttf',
    //     '.eot': 'application/vnd.ms-fontobject',
    //     '.otf': 'application/font-otf',
    //     '.svg': 'application/image/svg+xml'
    // };
    //
    // let content = Fs.createReadStream(filePath);
    //
    // const fileStat = Fs.statSync(filePath);
    // const fileSize = fileStat.size;
    // const range = request.headers.range;
    //
    // if (range) {
    //     console.log(range);
    //     // return;
    // }
    //
    // const gzip = Zlib.createGzip();
    //
    // gzip.on('error', function (error) {
    //     console.error(error);
    //     response.end();
    // });
    //
    // gzip.on('end', function () {
    //     console.log('end');
    //     response.end();
    // });
    //
    // content.on('error', function (error) {
    //     console.error(error);
    //     response.end();
    // });
    //
    // content.on('end', function () {
    //     console.log('end');
    //     response.end();
    // });
    //
    // response.writeHead(200, {
    //     'content-length': fileSize,
    //     'content-encoding': 'gzip',
    //     'content-type': mime[extname] || 'application/octet-stream'
    // });
    //
    // // content.pipe(response);
    // content.pipe(gzip).pipe(response);
    // response.end(content, 'utf-8');

    // Fs.readFile(filePath, function (error, content) {
    //     console.log(content);
    //     if (error) {
    //         if (error.code == 'ENOENT') {
    //             response.writeHead(404, { 'Content-Type': contentType });
    //             response.end('not found 404', 'utf-8');
    //         } else {
    //             response.writeHead(500);
    //             response.end('server issue 500', 'utf-8');
    //         }
    //     } else {
    //         response.writeHead(200, { 'Content-Type': contentType });
    //         response.end(content, 'utf-8');
    //     }
    // });

}).listen(8123);

console.log('Server running at http://127.0.0.1:8123/');
