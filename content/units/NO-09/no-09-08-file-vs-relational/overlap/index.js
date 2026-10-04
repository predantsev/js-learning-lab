// Two updates that overlap in time, against a JSON file repository and a SQLite repository.
//
// How this overlap differs from a real one:
// - the "overlap injector" is a fixed pause between reading and writing; real overlaps happen when two
//   requests arrive close together, so the bug shows up only sometimes;
// - node:sqlite is synchronous, so inside one process two SQL updates never interleave at all; between
//   processes SQLite's locks (and transactions) keep them apart.
import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { setTimeout as sleep } from 'node:timers/promises';

// Every save is atomic, as in NO-02: a temp file, then one rename (sync() left out to keep it short).
async function writeAtomic(target, value) {
  const temp = `${target}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value));
  await rename(temp, target);
}

const tasks = [
  { id: 't-01', title: '%%water%%', done: false },
  { id: 't-02', title: '%%library%%', done: false },
];
// The overlap injector: the first update to start pauses 20 ms between its read and its write, the second
// 40 ms. The pause is taken when an update starts, so the order of the calls decides it, not which read
// happens to finish first.
let started = 0;
const nextPause = () => 20 * ++started;

// File repository: every update reads the whole file, changes one record and writes the whole file back.
const fileRepo = {
  async update(id, patch) {
    const wait = nextPause();
    const records = JSON.parse(await readFile('tasks.json', 'utf8'));
    await sleep(wait); // meanwhile the other update reads the same old file
    const next = records.map((task) => (task.id === id ? { ...task, ...patch } : task));
    await writeAtomic('tasks.json', next);
  },
  async all() {
    return JSON.parse(await readFile('tasks.json', 'utf8'));
  },
};
const show = (list) => list.map((t) => `${t.id} done=${Boolean(t.done)} "${t.title}"`).join(' | ');

await writeAtomic('tasks.json', tasks);
await Promise.all([fileRepo.update('t-01', { done: true }), fileRepo.update('t-02', { title: '%%renamed%%' })]);
console.log('file, overlapping:   ', show(await fileRepo.all()));

// The same file repository behind a single-writer queue: each update starts after the previous one ended.
started = 0;
// Kept short: a failed update would also stop every update queued after it.
let queue = Promise.resolve();
const queued = (work) => (queue = queue.then(work));
await writeAtomic('tasks.json', tasks);
await Promise.all([
  queued(() => fileRepo.update('t-01', { done: true })),
  queued(() => fileRepo.update('t-02', { title: '%%renamed%%' })),
]);
console.log('file, queued:        ', show(await fileRepo.all()));

// SQLite repository: an UPDATE changes one row in place; nothing reads and rewrites the whole data set.
started = 0;
const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE tasks (id TEXT PRIMARY KEY, title TEXT NOT NULL, done INTEGER NOT NULL)');
const insert = db.prepare('INSERT INTO tasks VALUES (?, ?, ?)');
for (const task of tasks) insert.run(task.id, task.title, Number(task.done));
const sqlRepo = {
  async update(id, patch) {
    await sleep(nextPause());
    if ('done' in patch) db.prepare('UPDATE tasks SET done = ? WHERE id = ?').run(Number(patch.done), id);
    if ('title' in patch) db.prepare('UPDATE tasks SET title = ? WHERE id = ?').run(patch.title, id);
  },
};
await Promise.all([sqlRepo.update('t-01', { done: true }), sqlRepo.update('t-02', { title: '%%renamed%%' })]);
console.log('sqlite, overlapping: ', show(db.prepare('SELECT * FROM tasks ORDER BY id').all()));
db.close();
