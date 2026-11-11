import fs from 'node:fs';
import status from '../dist/status.js';

const classes = [];
const names = [];
for (const key in status) {
    const value = status[key];
    const name = value
        .toLowerCase()
        .replace(/^(\w)|(\s+|-)(\w)/g, (c) => c.toUpperCase())
        .replace(/\s|-|'/g, '');

    names.push(`\t${name},\n`);

    classes.push(`
class ${name} extends Error {
    code = ${Number(key)}
    message = "${value}"
    constructor (message?: string) { super(message); this.message = message || this.message; }
}
`);
}

const file = `
${classes.join('')}
export default {
${names.join('')}
}
`;

fs.writeFileSync('src/error.ts', file);
