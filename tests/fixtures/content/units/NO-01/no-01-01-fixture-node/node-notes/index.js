// Writes a file in the exercise folder, reads it back and prints what only Node.js can tell.
import fs from 'node:fs';
import path from 'node:path';

// A relative path starts from the working directory: the exercise folder of this run.
const file = path.join(process.cwd(), 'notes.txt');
fs.writeFileSync(file, '%%firstNote%%\n');
fs.appendFileSync(file, '%%secondNote%%\n');

const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
console.log(`Node.js ${process.version}`);
console.log(`%%savedLabel%%: ${path.basename(file)} (${lines.length})`);
for (const line of lines) console.log(`- ${line}`);
