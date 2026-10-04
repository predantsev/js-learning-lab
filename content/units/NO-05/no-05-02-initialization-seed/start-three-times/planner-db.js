// Startup initialization of the planner store in SQLite (node:sqlite, Node 22.13 or newer).
// PRAGMA user_version holds the schema version: a new database file reports 0.
import { readFile } from 'node:fs/promises';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Reading the fixtures waits 150 ms on purpose: it stands in for a slow disk or a large seed file,
// so that a request sent during initialization really arrives while init is still running.
async function loadFixtures() {
  await sleep(150);
  return JSON.parse(await readFile('fixtures.json', 'utf8'));
}

export async function initPlanner(db) {
  const fixtures = await loadFixtures();
  db.exec('BEGIN');
  try {
    const { user_version: version } = db.prepare('PRAGMA user_version').get();
    if (version === 0) {
      db.exec(`CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        dueDate TEXT,
        done INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'normal'
      )`);
      db.exec('PRAGMA user_version = 1');
    } else if (version !== 1) {
      throw new Error(`schema version ${version} is newer than this program knows`);
    }
    const { count } = db.prepare('SELECT count(*) AS count FROM tasks').get();
    if (count === 0) {
      const insert = db.prepare('INSERT INTO tasks (id, title, dueDate, done, priority) VALUES (?, ?, ?, ?, ?)');
      for (const task of fixtures) insert.run(task.id, task.title, task.dueDate, task.done ? 1 : 0, task.priority);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
