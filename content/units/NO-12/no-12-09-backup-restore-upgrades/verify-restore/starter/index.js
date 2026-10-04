// A demo (read-only): a good restore and one with a lost record; the exit code follows the report.
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { readTasks, writeTasks } from './store.js';
import { verifyRestore } from './verify-restore.js';

await rm('data', { recursive: true, force: true });
await writeTasks('data/live', [
  { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%books%%', dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-05', title: '%%dentist%%', dueDate: '2026-03-10', done: false, priority: 'normal' },
]);
await mkdir('data/good', { recursive: true });
await copyFile('data/live/tasks.json', 'data/good/tasks.json');
await writeTasks('data/lossy', (await readTasks('data/live')).slice(1));

for (const dir of ['data/good', 'data/lossy']) {
  const report = await verifyRestore('data/live', dir, '2026-03-02');
  console.log(dir, JSON.stringify(report));
  if (!report.ok) process.exitCode = 1;
}
