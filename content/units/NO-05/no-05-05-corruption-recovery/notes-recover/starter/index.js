// Starts the notes store three times: intact, after the file is cut off, and after it is deleted.
import { createHash } from 'node:crypto';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { recoverStore } from './app.js';

const store = (ids) => JSON.stringify({ schemaVersion: 1, records: ids.map((id, i) => ({ id, title: ['%%shopping%%', '%%ideas%%', '%%plan%%'][i] })) });
const sha = (text) => createHash('sha256').update(text).digest('hex');

await rm('data', { recursive: true, force: true });
await mkdir('data/backups', { recursive: true });
const backup = store(['n-01', 'n-02']);
await writeFile('data/backups/notes.2026-03-01.json', backup);
await writeFile('data/backups/notes.2026-03-01.json.manifest.json', JSON.stringify({ count: 2, sha256: sha(backup) }));

async function start(label, stamp) {
  try {
    console.log(`${label}: ${JSON.stringify(await recoverStore('data/notes.json', 'data/backups', stamp))}`);
  } catch (error) {
    console.log(`${label}: rejected — ${error.message}`);
  }
}

const live = store(['n-01', 'n-02', 'n-03']);
await writeFile('data/notes.json', live);
await start('intact', 't1');
await writeFile('data/notes.json', live.slice(0, 50));
await start('torn', 't2');
await rm('data/notes.json', { force: true });
await start('missing', 't3');
console.log(`data/: ${(await readdir('data')).sort().join(', ')}`);
