// Reads a small planner file and a 3 MB export with a 1 MB limit and prints what happened.
import { writeFile } from 'node:fs/promises';
import { readBounded } from './app.js';

const MAX_BYTES = 1024 * 1024;
await writeFile('planner.json', JSON.stringify([{ id: 't-05', title: '%%task5%%', dueDate: '2026-03-10', done: false, priority: 'normal' }]));
await writeFile('planner-export.txt', '2026-03-10 t-05 pending\n'.repeat(131_072)); // 3 MB

for (const file of ['planner.json', 'planner-export.txt']) {
  try {
    const bytes = await readBounded(file, MAX_BYTES);
    console.log(`${file}: ${bytes.length} %%bytesRead%%`);
  } catch (error) {
    console.log(`${file}: ${error.name}: ${error.message}`);
  }
}
