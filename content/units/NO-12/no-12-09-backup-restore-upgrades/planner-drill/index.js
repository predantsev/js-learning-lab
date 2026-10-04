// A backup, a restore drill into a fresh folder, and the summary check that runs after every
// dependency upgrade. Writes are paused while the backup is taken (the copy happens between
// writes), so the backup is a consistent snapshot.
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { readTasks, writeTasks } from './store.js';
import { dayUtilsVersion, summary } from './service.js';

await rm('data', { recursive: true, force: true });
const fixtures = [
  { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: '%%books%%', dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: '%%grandma%%', dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: '%%internet%%', dueDate: '2026-02-27', done: true, priority: 'high' },
  { id: 't-05', title: '%%dentist%%', dueDate: '2026-03-10', done: false, priority: 'normal' },
  { id: 't-06', title: '%%wardrobe%%', dueDate: '2026-03-05', done: true, priority: 'low' },
];
await writeTasks('data/live', fixtures);

// Backup: a copy of the last complete file, taken between writes.
await mkdir('data/backups', { recursive: true });
await copyFile('data/live/tasks.json', 'data/backups/tasks-1.json');

// Restore drill: into a folder that did not exist, then the same questions to both.
await rm('data/drill', { recursive: true, force: true });
await mkdir('data/drill');
await copyFile('data/backups/tasks-1.json', 'data/drill/tasks.json');
const ids = async (dir) => (await readTasks(dir)).map((task) => task.id).sort().join(',');
const day = '2026-03-02';
const live = await summary('data/live', day);
const restored = await summary('data/drill', day);
console.log(`%%drill%%: ids ${(await ids('data/live')) === (await ids('data/drill')) ? '%%same%%' : '%%differ%%'}, summary live ${JSON.stringify(live)} / restored ${JSON.stringify(restored)}`);

// The check after an upgrade: the fixtures have a known answer.
const expected = { pending: 4, dueBy: 2 };
const ok = live.pending === expected.pending && live.dueBy === expected.dueBy;
console.log(`day-utils ${dayUtilsVersion}: %%dueBy%% ${day} — %%expected%% ${expected.dueBy}, %%got%% ${live.dueBy} ${ok ? '✔' : '✖'}`);
if (!ok) process.exitCode = 1;
