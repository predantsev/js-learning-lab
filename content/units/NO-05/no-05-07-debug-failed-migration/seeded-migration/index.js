// Runs the seeded upgrade on a reading list and shows what it left in the file.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { upgrade } from './migrate.js';

await rm('data', { recursive: true, force: true });
await mkdir('data', { recursive: true });
await writeFile('data/reading.json', JSON.stringify({
  schemaVersion: 1,
  records: [
    { id: 'b-01', title: '%%b1%%', pages: '312', finished: 'yes' },
    { id: 'b-02', title: '%%b2%%', pages: '96', finished: 'no' },
    { id: 'b-03', title: '%%b3%%', pages: '450', finished: 'no' },
    { id: 'b-04', title: '%%b4%%', pages: 280, finished: 'yes' }, // stored by an older client
    { id: 'b-05', title: '%%b5%%', pages: '64', finished: 'no' },
  ],
}));

async function run(label) {
  try {
    console.log(`${label}: ${await upgrade('data/reading.json')}`);
  } catch (error) {
    console.log(`${label}: ${error.name}: ${error.message}`);
  }
}

await run('upgrade');
const stored = JSON.parse(await readFile('data/reading.json', 'utf8'));
console.log(`schemaVersion: ${stored.schemaVersion}`);
for (const book of stored.records) console.log(`  ${book.id} pages=${JSON.stringify(book.pages)} finished=${JSON.stringify(book.finished)}`);
await run('upgrade again');
