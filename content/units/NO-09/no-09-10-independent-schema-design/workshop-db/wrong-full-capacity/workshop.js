// A workshop booking database: rooms, sessions and bookings. See the task for every rule.
import { fixtures } from './data.js';
export const migrations = [
  {
    version: 1,
    up: `
      CREATE TABLE rooms (
        id       INTEGER PRIMARY KEY,
        name     TEXT NOT NULL UNIQUE,
        capacity INTEGER NOT NULL CHECK (capacity > 0)
      );
      CREATE TABLE sessions (
        id     INTEGER PRIMARY KEY,
        title  TEXT NOT NULL,
        roomId INTEGER NOT NULL REFERENCES rooms(id),
        day    TEXT NOT NULL
      );
      CREATE TABLE bookings (
        sessionId INTEGER NOT NULL REFERENCES sessions(id),
        attendee  TEXT NOT NULL,
        PRIMARY KEY (sessionId, attendee)
      );
    `,
  },
  {
    version: 2,
    up: "ALTER TABLE sessions ADD COLUMN level TEXT NOT NULL DEFAULT 'intro' CHECK (level IN ('intro', 'advanced'))",
  },
];

export function migrate(db) {
  const applied = [];
  for (const { version, up } of [...migrations].sort((a, b) => a.version - b.version)) {
    if (version <= db.prepare('PRAGMA user_version').get().user_version) continue;
    db.exec('BEGIN');
    try {
      db.exec(up);
      db.exec(`PRAGMA user_version = ${Number(version)}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    applied.push(version);
  }
  return applied;
}

export function seed(db) {
  if (db.prepare('SELECT COUNT(*) AS n FROM rooms').get().n > 0) return false;
  db.exec('BEGIN');
  try {
    const room = db.prepare('INSERT INTO rooms (id, name, capacity) VALUES (:id, :name, :capacity)');
    const session = db.prepare('INSERT INTO sessions (id, title, roomId, day) VALUES (:id, :title, :roomId, :day)');
    const booking = db.prepare('INSERT INTO bookings (sessionId, attendee) VALUES (:sessionId, :attendee)');
    fixtures.rooms.forEach((r) => room.run(r));
    fixtures.sessions.forEach((s) => session.run(s));
    fixtures.bookings.forEach((b) => booking.run(b));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return true;
}

export function sessionsWithRoom(db, day) {
  return db
    .prepare(`SELECT sessions.title, rooms.name AS room FROM sessions
              JOIN rooms ON rooms.id = sessions.roomId
              WHERE sessions.day = ? ORDER BY sessions.id`)
    .all(day).map((row) => ({ ...row }));
}

export function bookingsPerSession(db) {
  return db
    .prepare(`SELECT sessions.title, COUNT(bookings.attendee) AS booked FROM sessions
              LEFT JOIN bookings ON bookings.sessionId = sessions.id
              GROUP BY sessions.id ORDER BY booked DESC, sessions.id`)
    .all().map((row) => ({ ...row }));
}

export function fullSessions(db) {
  return db
    .prepare(`SELECT sessions.title FROM sessions
              JOIN rooms ON rooms.id = sessions.roomId
              JOIN bookings ON bookings.sessionId = sessions.id
              GROUP BY sessions.id HAVING COUNT(*) > rooms.capacity ORDER BY sessions.id`)
    .all()
    .map((row) => row.title);
}

export const indexSql = 'CREATE INDEX bookings_attendee ON bookings (attendee)';

export const report = {
  indexReason: 'The key of bookings starts with sessionId, so a lookup by attendee scanned every booking; the index on attendee turns it into a search.',
  storageChoice: 'Three related tables with joins and a capacity rule fit SQLite well; a single JSON file would do only for one person with a few sessions.',
};
