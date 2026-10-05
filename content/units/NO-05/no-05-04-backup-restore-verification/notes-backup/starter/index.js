// Backs up a notes store, verifies the backup, then damages the backup and verifies it again.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { backupStore, verifyBackup } from './app.js';

await rm('data', { recursive: true, force: true });
await mkdir('data/backups', { recursive: true });
await mkdir('data/scratch', { recursive: true });
await writeFile('data/notes.json', JSON.stringify({
  schemaVersion: 1,
  records: [
    { id: 'n-01', title: '%%shopping%%', body: '', pinned: true },
    { id: 'n-02', title: '%%ideas%%', body: '', pinned: false },
  ],
}));

const manifest = await backupStore('data/notes.json', 'data/backups/notes.1.json');
console.log('manifest:', JSON.stringify(manifest));
console.log('verify:', JSON.stringify(await verifyBackup('data/backups/notes.1.json', 'data/scratch')));

const text = await readFile('data/backups/notes.1.json', 'utf8');
await writeFile('data/backups/notes.1.json', text.slice(0, text.length - 5)); // the backup loses its last bytes
console.log('verify damaged:', JSON.stringify(await verifyBackup('data/backups/notes.1.json', 'data/scratch')));
