// Assessment checks for workshop.js. Every check builds its own in-memory database.
import { DatabaseSync } from 'node:sqlite';
import { fixtures, attendeeQuery } from './data.js';
import * as workshop from './workshop.js';

const fns = ['migrate', 'seed', 'sessionsWithRoom', 'bookingsPerSession', 'fullSessions'];
function guard() {
  for (const name of fns) expect(typeof workshop[name], `type of ${name}`).toBe('function');
  expect(Array.isArray(workshop.migrations), 'migrations is an array').toBe(true);
}
function fresh() {
  guard();
  const db = new DatabaseSync(':memory:');
  workshop.migrate(db);
  return db;
}
function seeded() {
  const db = fresh();
  workshop.seed(db);
  return db;
}
// A database created by an earlier version of the app: only migration 1, already holding the data.
function versionOne() {
  guard();
  const db = new DatabaseSync(':memory:');
  db.exec(workshop.migrations.find((m) => m.version === 1).up);
  db.exec('PRAGMA user_version = 1');
  for (const r of fixtures.rooms) db.prepare('INSERT INTO rooms (id, name, capacity) VALUES (?, ?, ?)').run(r.id, r.name, r.capacity);
  for (const s of fixtures.sessions) db.prepare('INSERT INTO sessions (id, title, roomId, day) VALUES (?, ?, ?, ?)').run(s.id, s.title, s.roomId, s.day);
  for (const b of fixtures.bookings) db.prepare('INSERT INTO bookings (sessionId, attendee) VALUES (?, ?)').run(b.sessionId, b.attendee);
  return db;
}
const throws = (work) => {
  try {
    work();
    return false;
  } catch {
    return true;
  }
};
const count = (db, table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
const version = (db) => db.prepare('PRAGMA user_version').get().user_version;

test('a room needs a positive capacity and a name no other room has', () => {
  const db = seeded();
  expect(throws(() => db.prepare("INSERT INTO rooms (name, capacity) VALUES ('Hall', 0)").run()), 'a room with capacity 0 is refused').toBe(true);
  expect(throws(() => db.prepare('INSERT INTO rooms (name, capacity) VALUES (?, 5)').run(L.room1)), 'a second room with an existing name is refused').toBe(true);
  expect(throws(() => db.prepare("INSERT INTO rooms (name, capacity) VALUES ('Hall', 5)").run()), 'a valid new room is accepted').toBe(false);
});

test('a session must be in an existing room', () => {
  const db = seeded();
  expect(throws(() => db.prepare("INSERT INTO sessions (title, roomId, day) VALUES ('X', 99, '2026-04-12')").run()), 'a session in room 99 is refused').toBe(true);
});

test('an attendee books a session only once, but may book several sessions', () => {
  const db = seeded();
  expect(throws(() => db.prepare('INSERT INTO bookings (sessionId, attendee) VALUES (1, ?)').run(L.lina)), 'a second booking of session 1 by the same attendee is refused').toBe(true);
  expect(throws(() => db.prepare('INSERT INTO bookings (sessionId, attendee) VALUES (3, ?)').run(L.lina)), 'a booking of session 3 by an attendee who booked others is accepted').toBe(false);
  expect(throws(() => db.prepare('INSERT INTO bookings (sessionId, attendee) VALUES (99, ?)').run(L.lina)), 'a booking of session 99 is refused').toBe(true);
});

test('sessionsWithRoom lists the sessions of a day with their room', () => {
  const db = seeded();
  expect(workshop.sessionsWithRoom(db, '2026-04-10').map((row) => ({ ...row })), 'sessions on 2026-04-10').toEqual([
    { title: L.introSql, room: L.room1 },
    { title: L.indexes, room: L.lab },
  ]);
});

test('sessionsWithRoom treats the day only as data', () => {
  const db = seeded();
  expect(workshop.sessionsWithRoom(db, "x' OR 1=1 --"), "sessions on the day x' OR 1=1 --").toEqual([]);
});

test('bookingsPerSession counts every session, zero included, most booked first', () => {
  const db = seeded();
  expect(workshop.bookingsPerSession(db).map((row) => ({ ...row })), 'bookings per session').toEqual([
    { title: L.introSql, booked: 2 },
    { title: L.indexes, booked: 1 },
    { title: L.migrations, booked: 0 },
  ]);
});

test('fullSessions lists the sessions whose bookings reach the room capacity', () => {
  const db = seeded();
  expect(workshop.fullSessions(db), 'full sessions').toEqual([L.introSql]);
  db.prepare('INSERT INTO bookings (sessionId, attendee) VALUES (2, ?), (2, ?)').run(L.denys, L.anna);
  expect(workshop.fullSessions(db), 'full sessions after two more bookings of session 2').toEqual([L.introSql, L.indexes]);
});

test('the lookup of an attendee’s bookings searches an index', () => {
  const db = seeded();
  expect(typeof workshop.indexSql, 'type of indexSql').toBe('string');
  db.exec(workshop.indexSql);
  const plan = db.prepare(`EXPLAIN QUERY PLAN ${attendeeQuery}`).all().map((row) => row.detail);
  expect(plan.some((line) => /^SEARCH bookings USING (COVERING )?INDEX/.test(line)), `plan: ${plan.join(' | ')}`).toBe(true);
});

test('migrate brings a version 1 database with data to version 2 without losing rows', () => {
  const db = versionOne();
  expect(workshop.migrate(db), 'versions applied to the version 1 database').toEqual([2]);
  expect(version(db), 'user_version').toBe(2);
  expect([count(db, 'rooms'), count(db, 'sessions'), count(db, 'bookings')], 'rooms, sessions, bookings').toEqual([2, 3, 3]);
  expect(db.prepare('SELECT level FROM sessions ORDER BY id').all().map((s) => s.level), 'level of the old sessions').toEqual(['intro', 'intro', 'intro']);
});

test('migrate on an empty database applies 1 and 2, and a rerun applies nothing', () => {
  guard();
  const db = new DatabaseSync(':memory:');
  expect(workshop.migrate(db), 'first run').toEqual([1, 2]);
  expect(workshop.migrate(db), 'second run').toEqual([]);
  expect(version(db), 'user_version').toBe(2);
});

test('a level other than intro or advanced is refused', () => {
  const db = seeded();
  expect(throws(() => db.exec("UPDATE sessions SET level = 'advanced' WHERE id = 2")), 'level advanced is accepted').toBe(false);
  expect(throws(() => db.exec("UPDATE sessions SET level = 'expert' WHERE id = 2")), 'level expert is refused').toBe(true);
  expect(throws(() => db.exec('UPDATE sessions SET level = NULL WHERE id = 2')), 'level NULL is refused').toBe(true);
});

test('seed fills an empty database once and leaves a filled one alone', () => {
  const db = fresh();
  workshop.seed(db);
  expect([count(db, 'rooms'), count(db, 'sessions'), count(db, 'bookings')], 'after the first seed').toEqual([2, 3, 3]);
  expect(throws(() => workshop.seed(db)), 'a second seed throws').toBe(false);
  expect([count(db, 'rooms'), count(db, 'sessions'), count(db, 'bookings')], 'after the second seed').toEqual([2, 3, 3]);
});

test('the report explains the index and the storage choice', () => {
  const report = workshop.report ?? {};
  expect(String(report.indexReason ?? '').trim().length, 'length of report.indexReason').toBeGreaterThanOrEqual(30);
  expect(String(report.storageChoice ?? '').trim().length, 'length of report.storageChoice').toBeGreaterThanOrEqual(30);
});
