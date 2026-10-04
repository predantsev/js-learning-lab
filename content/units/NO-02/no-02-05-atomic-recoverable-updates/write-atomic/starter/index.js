// Saves the planner twice, plants a stale temp file as if a crash had left it, then "restarts".
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { removeStaleTemps, writeAtomic } from './app.js';

await mkdir('data', { recursive: true });
const task = { id: 't-01', title: '%%task1%%', dueDate: '2026-03-02', done: false, priority: 'normal' };

await writeAtomic('data/planner.json', { schemaVersion: 1, records: [task] });
await writeAtomic('data/planner.json', { schemaVersion: 1, records: [{ ...task, done: true }] });
console.log('planner.json:', await readFile('data/planner.json', 'utf8'));

await writeFile('data/planner.json.4f2a.tmp', '{"schemaVersion":1,"rec'); // what a crash leaves behind
console.log('%%before%%:', (await readdir('data')).join(', '));
await removeStaleTemps('data');
console.log('%%after%%:', (await readdir('data')).join(', '));
