// Pins ten notes at the same time and counts how many pins were stored.
import { mkdir, writeFile } from 'node:fs/promises';
import { notesRepository } from './notes-repo.js';

await mkdir('data', { recursive: true });
const ids = Array.from({ length: 10 }, (_, i) => `n-${String(i + 1).padStart(2, '0')}`);
await writeFile('data/notes.json', JSON.stringify({ schemaVersion: 1, records: ids.map((id) => ({ id, title: `%%note%% ${id}`, pinned: false })) }));

const repo = notesRepository('data/notes.json');
await Promise.all(ids.map((id) => repo.updateNote(id, { pinned: true })));
const pinned = (await repo.list()).filter((note) => note.pinned).length;
console.log(`%%pinned%%: ${pinned} / ${ids.length}`);
