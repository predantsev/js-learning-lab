// Migrates and seeds an empty planner database twice, then an older one that is at version 1.
import { DatabaseSync } from 'node:sqlite';
import { migrations, fixtures } from './migrations.js';
import { migrate, seed } from './app.js';

const version = (db) => db.prepare('PRAGMA user_version').get().user_version;
const count = (db) => db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n;
const attempt = (label, work) => {
  try {
    console.log(label, '→', JSON.stringify(work()));
  } catch (error) {
    console.log(label, '→', error.message);
  }
};

const empty = new DatabaseSync(':memory:');
attempt('empty: migrate', () => migrate(empty, migrations));
attempt('empty: seed', () => seed(empty, fixtures));
attempt('empty: migrate again', () => migrate(empty, migrations));
attempt('empty: seed again', () => seed(empty, fixtures));
attempt('empty: version, tasks', () => [version(empty), count(empty)]);

const older = new DatabaseSync(':memory:');
older.exec(migrations[0].up);
older.exec('PRAGMA user_version = 1');
older.exec("INSERT INTO tasks (id, title, dueDate) VALUES ('t-09', '%%wardrobe%%', '2026-03-05')");
attempt('older: migrate', () => migrate(older, migrations));
attempt('older: seed', () => seed(older, fixtures));
attempt('older: version, tasks', () => [version(older), count(older)]);
