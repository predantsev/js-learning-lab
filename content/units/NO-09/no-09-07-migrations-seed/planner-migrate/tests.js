// Each check uses fresh in-memory databases and the migrations of migrations.js (or a variant of them).
import { DatabaseSync } from 'node:sqlite';
import { migrations, fixtures } from './migrations.js';
import { migrate, seed } from './app.js';

const version = (db) => db.prepare('PRAGMA user_version').get().user_version;
const columns = (db) => db.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
const count = (db) => db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n;
const guard = () => {
  expect(typeof migrate, 'type of migrate').toBe('function');
  expect(typeof seed, 'type of seed').toBe('function');
};
function olderDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec(migrations[0].up);
  db.exec('PRAGMA user_version = 1');
  db.exec(`INSERT INTO tasks (id, title, dueDate) VALUES ('t-09', '${L.wardrobe}', '2026-03-05'), ('t-10', '${L.dentist}', NULL)`);
  return db;
}

test('an empty database gets every migration, version 3', () => {
  guard();
  const db = new DatabaseSync(':memory:');
  expect(migrate(db, migrations), 'versions applied').toEqual([1, 2, 3]);
  expect(version(db), 'user_version').toBe(3);
  expect(columns(db), 'columns of tasks').toContain('done');
});

test('running migrate again applies nothing', () => {
  guard();
  const db = new DatabaseSync(':memory:');
  migrate(db, migrations);
  expect(migrate(db, migrations), 'versions applied by the second run').toEqual([]);
  expect(version(db), 'user_version').toBe(3);
});

test('a database at version 1 gets only 2 and 3 and keeps its rows', () => {
  guard();
  const db = olderDatabase();
  expect(migrate(db, migrations), 'versions applied').toEqual([2, 3]);
  expect(count(db), 'tasks after the migration').toBe(2);
  expect(db.prepare('SELECT done FROM tasks').all().map((t) => t.done), 'done of the old tasks').toEqual([0, 0]);
});

test('migrations listed out of order are applied in version order', () => {
  guard();
  const db = new DatabaseSync(':memory:');
  expect(migrate(db, [migrations[2], migrations[0], migrations[1]]), 'versions applied').toEqual([1, 2, 3]);
});

test('a failing migration is rolled back and the version stays', () => {
  guard();
  const db = olderDatabase();
  const broken = [
    migrations[0],
    { version: 2, up: 'ALTER TABLE tasks ADD COLUMN priority TEXT; INSERT INTO missing_table VALUES (1)' },
  ];
  let failed = false;
  try {
    migrate(db, broken);
  } catch {
    failed = true;
  }
  expect(failed, 'migrate throws when migration 2 fails').toBe(true);
  expect(version(db), 'user_version after the failure').toBe(1);
  expect(columns(db), 'columns of tasks after the failure').not.toContain('priority');
});

test('seed fills an empty table once', () => {
  guard();
  const db = new DatabaseSync(':memory:');
  migrate(db, migrations);
  expect(seed(db, fixtures), 'first seed').toBe(fixtures.length);
  expect(seed(db, fixtures), 'second seed').toBe(0);
  expect(count(db), 'tasks after two seeds').toBe(fixtures.length);
});

test('seed leaves a table that already has rows alone', () => {
  guard();
  const db = olderDatabase();
  expect(seed(db, fixtures), 'seed of a table with 2 tasks').toBe(0);
  expect(count(db), 'tasks afterwards').toBe(2);
});
