// The seeded repository with three inputs: a ../ name, a Ukrainian note, a crash during save.
import { mkdir, writeFile } from 'node:fs/promises';
import { withCrashingWrites } from './crash.js';
import { createRepo } from './repo.js';

await mkdir('data/archive', { recursive: true });
await mkdir('config', { recursive: true });
await writeFile('config/.env', 'API_KEY=example-not-real'); // outside data/
await writeFile('data/t-01.txt', 'Лійка стоїть на балконі.'); // a note in Ukrainian, saved as UTF-8

const repo = createRepo('data');

// 1. A name from a request.
try {
  console.log('1.', await repo.readNote('archive/../../config/.env'));
} catch (error) {
  console.log('1. %%refused%%:', error.message);
}

// 2. A Ukrainian note.
console.log('2.', await repo.readNote('t-01.txt'));

// 3. Save, then a crash during the next save, then a "restart" that loads the tasks.
const task = { id: 't-01', title: '%%task1%%', dueDate: '2026-03-02', done: false, priority: 'normal' };
await repo.saveRecords([task]);
try {
  await withCrashingWrites(() => repo.saveRecords([{ ...task, done: true }]));
} catch (error) {
  console.log('3. %%saveFailed%%:', error.message);
}
try {
  const records = await repo.loadRecords();
  console.log('3. %%afterRestart%%:', records.map((t) => `${t.id} done=${t.done}`).join(', '));
} catch (error) {
  console.log(`3. %%afterRestart%%: ${error.name}: ${error.message}`);
}
