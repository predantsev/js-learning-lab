// Three planner repositories with the same method: markDone(id).
import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';

async function writeAtomic(file, value) {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value));
  await rename(temp, file);
}

// 1. A JSON file: read the whole store, change one task, write the whole store back.
export function fileRepository(file) {
  return {
    async markDone(id) {
      const store = JSON.parse(await readFile(file, 'utf8'));
      store.records = store.records.map((task) => (task.id === id ? { ...task, done: true } : task));
      await writeAtomic(file, store);
    },
    async doneCount() {
      return JSON.parse(await readFile(file, 'utf8')).records.filter((task) => task.done).length;
    },
  };
}

// 2. The same file, but every read-modify-write waits for the previous one: a single-writer queue.
export function queuedFileRepository(file) {
  const inner = fileRepository(file);
  const waiting = []; // jobs that wait for their turn
  let busy = false;
  function startNext() {
    if (busy || waiting.length === 0) return;
    busy = true;
    const job = waiting.shift();
    job.work().then(job.resolve, job.reject).finally(() => {
      busy = false;
      startNext();
    });
  }
  const queued = (work) => new Promise((resolve, reject) => {
    waiting.push({ work, resolve, reject });
    startNext();
  });
  return { markDone: (id) => queued(() => inner.markDone(id)), doneCount: inner.doneCount };
}

// 3. SQLite: one UPDATE statement changes one row; the database applies it as a whole.
export function sqliteRepository(dbFile) {
  const db = new DatabaseSync(dbFile);
  return {
    async markDone(id) {
      db.prepare('UPDATE tasks SET done = 1 WHERE id = ?').run(id);
    },
    async doneCount() {
      return db.prepare('SELECT count(*) AS count FROM tasks WHERE done = 1').get().count;
    },
    close: () => db.close(),
  };
}
