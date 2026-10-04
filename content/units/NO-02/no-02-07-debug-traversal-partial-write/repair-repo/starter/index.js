// Uses the repository the way the server will: read notes, save and load the tasks.
import { mkdir, writeFile } from 'node:fs/promises';
import { createRepo } from './repo.js';

await mkdir('data/archive', { recursive: true });
await writeFile('data/t-01.txt', '%%note1%%');
await writeFile('data/archive/t-04.txt', '%%note4%%');

const repo = createRepo('data');
console.log('t-01.txt:', await repo.readNote('t-01.txt'));
console.log('archive/t-04.txt:', await repo.readNote('archive/t-04.txt'));

const tasks = [{ id: 't-01', title: '%%task1%%', dueDate: '2026-03-02', done: true, priority: 'normal' }];
await repo.saveRecords(tasks);
console.log('loaded:', (await repo.loadRecords()).map((task) => `${task.id} ${task.title}`).join(', '));
