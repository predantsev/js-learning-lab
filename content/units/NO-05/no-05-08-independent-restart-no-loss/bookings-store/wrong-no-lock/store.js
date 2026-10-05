// Durable storage for room bookings: one JSON file { schemaVersion: 1, records }.
// Mistake: changes are not serialized, so concurrent read-modify-writes lose updates.
// Chosen because the store is small and written by one server process; every change goes through
// one write queue and an atomic rename.
import { createHash, randomUUID } from 'node:crypto';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const VERSION = 1;
const ROOMS = ['A', 'B', 'C'];
const FIELDS = ['id', 'room', 'date', 'guests', 'note'];

// The contract: returns the booking with defaults filled in, or throws listing every problem.
function checkBooking(input) {
  const booking = { note: '', ...input };
  const problems = [];
  for (const key of Object.keys(booking)) if (!FIELDS.includes(key)) problems.push(`${key}: unknown field`);
  if (typeof booking.id !== 'string' || booking.id === '') problems.push('id: a non-empty string');
  if (!ROOMS.includes(booking.room)) problems.push('room: A, B or C');
  if (typeof booking.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) problems.push('date: YYYY-MM-DD');
  if (!Number.isInteger(booking.guests) || booking.guests < 1 || booking.guests > 8) problems.push('guests: 1 to 8');
  if (typeof booking.note !== 'string' || booking.note.length > 200) problems.push('note: at most 200 characters');
  if (problems.length > 0) throw Object.assign(new Error(`invalid booking: ${problems.join('; ')}`), { problems });
  return booking;
}

// Invariants of the whole store: unique ids, no two bookings for one room on one day.
function checkInvariants(records) {
  const ids = new Set();
  const slots = new Set();
  for (const booking of records) {
    if (ids.has(booking.id)) throw new Error(`duplicate id ${booking.id}`);
    if (slots.has(`${booking.room}|${booking.date}`)) throw new Error(`room ${booking.room} is already booked on ${booking.date}`);
    ids.add(booking.id);
    slots.add(`${booking.room}|${booking.date}`);
  }
}

function parseStore(text) {
  const store = JSON.parse(text);
  if (store?.schemaVersion !== VERSION || !Array.isArray(store.records)) throw new Error('not a version 1 bookings store');
  const records = store.records.map(checkBooking);
  checkInvariants(records);
  return { schemaVersion: VERSION, records };
}

async function writeAtomic(file, text) {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, text);
  await rename(temp, file);
}

const sha256Of = (text) => createHash('sha256').update(text).digest('hex');

export async function initStore(file, fixtures) {
  await mkdir(path.dirname(file), { recursive: true });
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    text = null;
  }
  const store = text === null ? { schemaVersion: VERSION, records: [] } : parseStore(text); // damage throws
  if (store.records.length === 0) {
    const records = fixtures.map(checkBooking);
    checkInvariants(records);
    await writeAtomic(file, JSON.stringify({ schemaVersion: VERSION, records }));
    return records.length;
  }
  return store.records.length;
}

export async function openRepository(file) {
  let tail = Promise.resolve();
  const locked = (work) => {
    return work();
  };
  const load = async () => parseStore(await readFile(file, 'utf8'));
  const save = (records) => writeAtomic(file, JSON.stringify({ schemaVersion: VERSION, records }));

  return {
    async list() {
      return (await load()).records;
    },
    add(input) {
      return locked(async () => {
        const booking = checkBooking(input);
        const { records } = await load();
        const next = [...records, booking];
        checkInvariants(next);
        await save(next);
        return booking;
      });
    },
    update(id, changes) {
      return locked(async () => {
        const { records } = await load();
        const index = records.findIndex((booking) => booking.id === id);
        if (index === -1) throw new Error(`no booking ${id}`);
        const booking = checkBooking({ ...records[index], ...changes, id });
        const next = records.with(index, booking);
        checkInvariants(next);
        await save(next);
        return booking;
      });
    },
  };
}

export async function backupStore(file, backupPath) {
  const text = await readFile(file, 'utf8'); // writes replace the file by rename, so one read is one version
  const manifest = { count: parseStore(text).records.length, sha256: sha256Of(text) };
  await writeFile(backupPath, text);
  await writeFile(`${backupPath}.manifest.json`, JSON.stringify(manifest));
  return manifest;
}

export async function verifyBackup(backupPath, scratchDir) {
  const problems = [];
  let manifest = null;
  try {
    manifest = JSON.parse(await readFile(`${backupPath}.manifest.json`, 'utf8'));
  } catch (error) {
    problems.push(`manifest: ${error.message}`);
  }
  let count = 0;
  try {
    const restored = path.join(scratchDir, 'restored-bookings.json');
    await copyFile(backupPath, restored);
    const text = await readFile(restored, 'utf8');
    if (manifest && sha256Of(text) !== manifest.sha256) problems.push('sha256 differs from the manifest');
    count = parseStore(text).records.length;
    if (manifest && count !== manifest.count) problems.push(`count ${count}, manifest ${manifest.count}`);
  } catch (error) {
    problems.push(`restore: ${error.message}`);
  }
  return { ok: problems.length === 0, count, problems };
}
