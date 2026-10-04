// Takes a verified backup of the reading list, runs the upgrade, then the recovery, and shows the file.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { recoverAndUpgrade, upgrade } from './migrate.js';

const v1 = JSON.stringify({
  schemaVersion: 1,
  records: [
    { id: 'b-01', title: '%%b1%%', pages: '312', finished: 'yes' },
    { id: 'b-02', title: '%%b2%%', pages: '96', finished: 'no' },
    { id: 'b-03', title: '%%b3%%', pages: '450', finished: 'no' },
    { id: 'b-04', title: '%%b4%%', pages: 280, finished: 'yes' },
    { id: 'b-05', title: '%%b5%%', pages: '64', finished: 'no' },
  ],
});
await rm('data', { recursive: true, force: true });
await mkdir('data/backups', { recursive: true });
await writeFile('data/reading.json', v1);
await writeFile('data/backups/reading.v1.json', v1);
await writeFile('data/backups/reading.v1.json.manifest.json', JSON.stringify({ count: 5, sha256: createHash('sha256').update(v1).digest('hex') }));

async function show(label, work) {
  try {
    console.log(`${label}: ${await work()}`);
  } catch (error) {
    console.log(`${label}: ${error.name}: ${error.message}`);
  }
  const stored = JSON.parse(await readFile('data/reading.json', 'utf8'));
  console.log(`  schemaVersion ${stored.schemaVersion}, finished: ${stored.records.map((book) => JSON.stringify(book.finished)).join(' ')}`);
}

await show('upgrade', () => upgrade('data/reading.json'));
await show('recoverAndUpgrade', () => recoverAndUpgrade('data/reading.json', 'data/backups/reading.v1.json'));
