// Durable storage for room bookings in SQLite (node:sqlite). Chosen because "one room per day" is a
// UNIQUE constraint the database itself enforces, and every change is one synchronous statement or a
// transaction with no await inside. sqlite.backup() needs Node 22.16 or newer. On Node 22.13-22.15
// backupStore copies the file after closing its own connection: in this process that is a consistent
// moment (no transaction here spans an await), but a second PROCESS writing the same file at that
// moment could still leave the copy broken. That fallback was tried only by hiding sqlite.backup on
// Node 25.2.1, never on a real 22.13-22.15.
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sqlite, { DatabaseSync } from 'node:sqlite';

const ROOMS = ['A', 'B', 'C'];
const FIELDS = ['id', 'room', 'date', 'guests', 'note'];

function checkBooking(input) {
  const booking = { note: '', ...input };
  const problems = [];
  for (const key of Object.keys(booking)) if (!FIELDS.includes(key)) problems.push(`${key}: unknown field`);
  if (typeof booking.id !== 'string' || booking.id === '') problems.push('id');
  if (!ROOMS.includes(booking.room)) problems.push('room');
  if (typeof booking.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) problems.push('date');
  if (!Number.isInteger(booking.guests) || booking.guests < 1 || booking.guests > 8) problems.push('guests');
  if (typeof booking.note !== 'string' || booking.note.length > 200) problems.push('note');
  if (problems.length > 0) throw new Error(`invalid booking: ${problems.join(', ')}`);
  return booking;
}

const plain = (row) => ({ id: row.id, room: row.room, date: row.date, guests: row.guests, note: row.note });

// Opens and checks the database; creates the schema in a new file. Throws for a damaged file.
function openChecked(file) {
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  try {
    const [first] = db.prepare('PRAGMA integrity_check').all();
    if (first.integrity_check !== 'ok') throw new Error(`integrity_check: ${first.integrity_check}`);
    const { user_version: version } = db.prepare('PRAGMA user_version').get();
    if (version === 0) {
      db.exec(`CREATE TABLE bookings (
        id TEXT PRIMARY KEY, room TEXT NOT NULL, date TEXT NOT NULL,
        guests INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '', UNIQUE (room, date)
      ); PRAGMA user_version = 1;`);
    } else if (version !== 1) {
      throw new Error(`unknown schema version ${version}`);
    }
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export async function initStore(file, fixtures) {
  const db = openChecked(file);
  try {
    const { count } = db.prepare('SELECT count(*) AS count FROM bookings').get();
    if (count > 0) return count;
    const insert = db.prepare('INSERT INTO bookings (id, room, date, guests, note) VALUES (?, ?, ?, ?, ?)');
    db.exec('BEGIN');
    try {
      for (const input of fixtures) {
        const b = checkBooking(input);
        insert.run(b.id, b.room, b.date, b.guests, b.note);
      }
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    return fixtures.length;
  } finally {
    db.close();
  }
}

export async function openRepository(file) {
  const db = openChecked(file);
  const insert = (b) => db.prepare('INSERT INTO bookings (id, room, date, guests, note) VALUES (?, ?, ?, ?, ?)').run(b.id, b.room, b.date, b.guests, b.note);
  return {
    async list() {
      return db.prepare('SELECT * FROM bookings ORDER BY rowid').all().map(plain);
    },
    async add(input) {
      const booking = checkBooking(input);
      insert(booking); // PRIMARY KEY and UNIQUE (room, date) reject a clash
      return booking;
    },
    async update(id, changes) {
      db.exec('BEGIN');
      try {
        const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
        if (!row) throw new Error(`no booking ${id}`);
        const b = checkBooking({ ...plain(row), ...changes, id });
        db.prepare('UPDATE bookings SET room = ?, date = ?, guests = ?, note = ? WHERE id = ?').run(b.room, b.date, b.guests, b.note, id);
        db.exec('COMMIT');
        return b;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    close: () => db.close(),
  };
}

const sha256Of = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function backupStore(file, backupPath) {
  const db = openChecked(file);
  try {
    rmSync(backupPath, { force: true });
    if (typeof sqlite.backup === 'function') await sqlite.backup(db, backupPath);
  } finally {
    db.close();
  }
  if (typeof sqlite.backup !== 'function') copyFileSync(file, backupPath);
  const check = new DatabaseSync(backupPath, { readOnly: true });
  const { count } = check.prepare('SELECT count(*) AS count FROM bookings').get();
  check.close();
  const manifest = { count, sha256: sha256Of(readFileSync(backupPath)) };
  writeFileSync(`${backupPath}.manifest.json`, JSON.stringify(manifest));
  return manifest;
}

export async function verifyBackup(backupPath, scratchDir) {
  const problems = [];
  let count = 0;
  try {
    const manifest = JSON.parse(readFileSync(`${backupPath}.manifest.json`, 'utf8'));
    const restored = path.join(scratchDir, 'restored-bookings.db');
    rmSync(restored, { force: true });
    copyFileSync(backupPath, restored);
    if (sha256Of(readFileSync(restored)) !== manifest.sha256) problems.push('sha256 differs from the manifest');
    const db = openChecked(restored);
    try {
      count = db.prepare('SELECT count(*) AS count FROM bookings').get().count;
    } finally {
      db.close();
    }
    if (count !== manifest.count) problems.push(`count ${count}, manifest ${manifest.count}`);
  } catch (error) {
    problems.push(error.message);
  }
  return { ok: problems.length === 0, count, problems };
}
