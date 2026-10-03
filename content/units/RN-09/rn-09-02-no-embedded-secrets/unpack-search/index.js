// index.js: builds the package, then searches it like anyone who unpacked the installed app.
import { config } from './app.config.js';
import { buildPackage } from './build.js';

const SECRET = 'sk_lab_4f9e2b7c';

const unpacked = buildPackage(config);
console.log('files in the two packages:', Object.keys(unpacked).length);

const hits = Object.entries(unpacked)
  .filter(([, text]) => text.includes(SECRET))
  .map(([file]) => file);

if (hits.length === 0) console.log(`"${SECRET}" is in no file of either package`);
for (const file of hits) console.log(`found "${SECRET}" in ${file}`);
