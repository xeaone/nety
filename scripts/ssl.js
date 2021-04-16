'use strict';

const { promisify } = require('util');
const { exec } = require('child_process');
const Exec = promisify(exec);

Promise.resolve().then(async function () {
    let option = {};

    option.cn = 'localhost';

    const command = `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=${option.cn}' -keyout ${option.cn}-privkey.pem -out ${option.cn}-cert.pem`;

    const result = await Exec(command);

    console.log(result);

}).catch(console.error);
