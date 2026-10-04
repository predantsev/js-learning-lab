// Each check builds a fresh in-memory database from the learner's `schema` and inspects or uses it.
import { DatabaseSync } from 'node:sqlite';
import { schema } from './schema.js';

function open() {
  expect(typeof schema, 'type of schema').toBe('string');
  const db = new DatabaseSync(':memory:');
  db.exec(schema);
  return db;
}
const columns = (db, table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => ({ ...c }));
const fill = (db) => db.exec(`
  INSERT INTO students (id, name) VALUES (1, '${L.lina}'), (2, '${L.denys}');
  INSERT INTO clubs (id, title) VALUES (1, '${L.chess}'), (2, '${L.choir}');
`);
const join = (db, studentId, clubId) =>
  db.prepare(`INSERT INTO memberships (studentId, clubId, joinedOn) VALUES (${studentId}, ${clubId}, '2026-09-01')`).run();

test('the tables students, clubs and memberships exist', () => {
  const db = open();
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((t) => t.name);
  for (const table of ['students', 'clubs', 'memberships']) expect(names, 'tables in the database').toContain(table);
});

test('clubs has an integer primary key id and a title', () => {
  const db = open();
  const cols = columns(db, 'clubs');
  const id = cols.find((c) => c.name === 'id');
  expect(id?.pk, 'clubs.id is the primary key').toBe(1);
  expect(id?.type.toUpperCase(), 'type of clubs.id').toBe('INTEGER');
  expect(cols.map((c) => c.name), 'columns of clubs').toContain('title');
});

test('memberships points at students and clubs with foreign keys', () => {
  const db = open();
  const keys = db.prepare('PRAGMA foreign_key_list(memberships)').all().map((k) => `${k.from} → ${k.table}.${k.to ?? 'id'}`);
  expect(keys, 'foreign keys of memberships').toContain('studentId → students.id');
  expect(keys, 'foreign keys of memberships').toContain('clubId → clubs.id');
});

test('a membership of an unknown student is refused', () => {
  const db = open();
  fill(db);
  expect(() => join(db, 99, 1), 'membership of student 99').toThrow(/FOREIGN KEY/);
});

test('a student joins the same club only once', () => {
  const db = open();
  fill(db);
  join(db, 1, 1);
  expect(() => join(db, 1, 1), 'student 1 joins club 1 a second time').toThrow(/UNIQUE|PRIMARY KEY/);
});

test('a student can join two clubs, and a club can have two students', () => {
  const db = open();
  fill(db);
  join(db, 1, 1);
  join(db, 1, 2);
  join(db, 2, 1);
  expect(db.prepare('SELECT * FROM memberships').all().length, 'memberships stored').toBe(3);
});

test('memberships stores ids, not copies of names or titles', () => {
  const db = open();
  const copied = columns(db, 'memberships').map((c) => c.name).filter((name) => /name|title/i.test(name));
  expect(copied, 'columns of memberships that copy a name or a title').toEqual([]);
});
