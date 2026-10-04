// Where does a path point? Probes path.join, path.resolve and the working directory.
import fs from 'node:fs';
import path from 'node:path';

const root = import.meta.dirname; // the folder of this file
const short = (p) => path.relative(root, p) || '.'; // print paths relative to this folder
fs.mkdirSync('data/archive', { recursive: true });

console.log('join:', path.join('data', '../config/.env'));
console.log('resolve with an absolute name:', path.resolve('data', '/tmp/other.json'));

// The same two ways to build a path, before and after the working directory changes.
const fromWorkingDir = () => path.resolve('data/wishlist.json');
const fromThisFile = () => path.join(import.meta.dirname, 'data', 'wishlist.json');

console.log('cwd:', short(process.cwd()));
console.log('  resolve():', short(fromWorkingDir()));
console.log('  import.meta.dirname:', short(fromThisFile()));

process.chdir('data/archive');

console.log('cwd:', short(process.cwd()));
console.log('  resolve():', short(fromWorkingDir()));
console.log('  import.meta.dirname:', short(fromThisFile()));
