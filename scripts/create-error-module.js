const fs = require('fs');
const status = require('../src/status.js');

const classes = [];
const names = [];
for (const key in status) {
    const value = status[key];
    const name = value
        .toLowerCase()
        .replace(/^(\w)|(\s+|-)(\w)/g, c => c.toUpperCase())
        .replace(/\s|-|'/g, '');

    names.push(`\t${name},\n`);

    classes.push(`
class ${name} extends Error {
    code = ${Number(key)}
    message = "${value}"
    constructor (message) { super(message); this.message = message || this.message; }
}
`);

}

const file = `
${classes.join('')}
module.exports = {
${names.join('')}
}
`;

fs.writeFileSync('src/error.js', file);