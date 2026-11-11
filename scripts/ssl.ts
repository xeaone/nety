import { promisify } from 'node:util';
import { exec } from 'node:child_process';
const Exec = promisify(exec);

Promise.resolve()
    .then(async function () {
        const cn = 'localhost';

        const command = `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=${cn}' -keyout ${cn}-privkey.pem -out ${cn}-cert.pem`;

        const result = await Exec(command);

        console.log(result);
    })
    .catch(console.error);
