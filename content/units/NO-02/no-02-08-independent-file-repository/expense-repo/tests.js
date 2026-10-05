// Checks for createFileRepository. `instrument` wraps functions of node:fs/promises and methods of
// FileHandle (updating named imports with syncBuiltinESMExports) to record reads, syncs, renames and
// open handles, to slow every file operation down (concurrency check) or to cut every write half-way
// with an error (crash check).
import fsp, { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { syncBuiltinESMExports } from 'node:module';
import { createFileRepository } from './repository.js';

// Every FileHandle opened during the checks stays referenced here until the process ends, so a
// handle that was never closed is not closed by the garbage collector in the middle of a later check.
const retained = [];


const groceries = { id: 'e-01', label: L.groceries, amountMinor: 84550, date: '2026-03-01', category: 'food' };
const pass = { id: 'e-02', label: L.pass, amountMinor: 52000, date: '2026-03-01', category: 'transport' };
const coffee = { id: 'e-03', label: L.coffee, amountMinor: 18000, date: '2026-02-28', category: 'fun' };
const lunch = { id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food' };
const categories = [{ id: 'food', label: L.food }, { id: 'transport', label: L.transport }, { id: 'fun', label: L.fun }];
let cases = 0;

async function folder({ records, raw } = {}) {
  const dir = tmp(`case-${++cases}`);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'categories.json'), JSON.stringify(categories));
  if (records) await writeFile(path.join(dir, 'expenses.json'), JSON.stringify({ schemaVersion: 1, records }));
  if (raw !== undefined) await writeFile(path.join(dir, 'expenses.json'), raw);
  return dir;
}

const repoOf = (dir, maxBytes = 64 * 1024) => createFileRepository(dir, { maxBytes });
const byId = (records) => [...records].sort((a, b) => (a.id < b.id ? -1 : 1));

async function instrument(run, { crashWrites = false, slow = false } = {}) {
  const probe = await fsp.open(tmp('probe.txt'), 'w');
  const proto = Object.getPrototypeOf(probe);
  await probe.close();
  const events = [];
  const opened = [];
  let inProgress = 0;
  let most = 0;
  const real = { open: fsp.open, readFile: fsp.readFile, writeFile: fsp.writeFile, stat: fsp.stat, rename: fsp.rename };
  const realMethods = { read: proto.read, readFile: proto.readFile, write: proto.write, writeFile: proto.writeFile, sync: proto.sync, datasync: proto.datasync };
  const half = (data) => {
    const bytes = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    return bytes.subarray(0, Math.floor(bytes.length / 2));
  };
  const timed = (fn) => async (...args) => {
    inProgress += 1;
    most = Math.max(most, inProgress);
    try {
      if (slow) await sleep(30);
      return await fn(...args);
    } finally {
      inProgress -= 1;
    }
  };
  fsp.open = timed(async (...args) => {
    const handle = await real.open(...args);
    opened.push(handle);
    retained.push(handle);
    return handle;
  });
  fsp.stat = timed(real.stat);
  fsp.readFile = timed(async (...args) => {
    events.push({ type: 'read' });
    return real.readFile(...args);
  });
  fsp.rename = async (from, to) => {
    events.push({ type: 'rename', from: path.resolve(String(from)), to: path.resolve(String(to)) });
    return real.rename(from, to);
  };
  proto.read = function read(...args) {
    events.push({ type: 'read' });
    return realMethods.read.apply(this, args);
  };
  proto.readFile = function readFileOfHandle(...args) {
    events.push({ type: 'read' });
    return realMethods.readFile.apply(this, args);
  };
  proto.sync = function sync() {
    events.push({ type: 'sync' });
    return realMethods.sync.call(this);
  };
  proto.datasync = function datasync() {
    events.push({ type: 'sync' });
    return realMethods.datasync.call(this);
  };
  if (crashWrites) {
    fsp.writeFile = async (file, data) => {
      await real.writeFile(file, half(data));
      throw new Error('simulated crash in the middle of writeFile');
    };
    proto.write = async function write(data) {
      await realMethods.write.call(this, half(data));
      throw new Error('simulated crash in the middle of write');
    };
    proto.writeFile = async function writeFileOfHandle(data) {
      await realMethods.write.call(this, half(data));
      throw new Error('simulated crash in the middle of writeFile');
    };
  }
  syncBuiltinESMExports();
  let outcome;
  try {
    outcome = { value: await run() };
  } catch (error) {
    outcome = { error };
  } finally {
    Object.assign(fsp, real);
    Object.assign(proto, realMethods);
    syncBuiltinESMExports();
  }
  return { ...outcome, events, most, stillOpen: opened.filter((h) => h.fd !== -1).length };
}

const guard = () => expect(typeof createFileRepository, 'type of createFileRepository').toBe('function');

test('list() of a folder without expenses.json is []', async () => {
  guard();
  expect(await repoOf(await folder()).list(), 'list() before anything was saved').toEqual([]);
});

test('save stores { schemaVersion: 1, records } and replaces a record with the same id', async () => {
  guard();
  const dir = await folder();
  const repo = repoOf(dir);
  await repo.save(groceries);
  await repo.save(pass);
  const cheaper = { ...groceries, amountMinor: 80000 };
  await repo.save(cheaper);
  expect(byId(await repo.list()), 'list() after saving e-01, e-02 and e-01 again').toEqual([cheaper, pass]);
  expect(await repo.get('e-01'), 'get("e-01")').toEqual(cheaper);
  const file = JSON.parse(await readFile(path.join(dir, 'expenses.json'), 'utf8'));
  expect(file.schemaVersion, 'schemaVersion in expenses.json').toBe(1);
  expect(byId(file.records), 'records in expenses.json').toEqual([cheaper, pass]);
});

test('get and remove of an unknown id give null and false; remove deletes a record', async () => {
  guard();
  const repo = repoOf(await folder({ records: [groceries, pass] }));
  expect(await repo.get('e-99'), 'get("e-99")').toBe(null);
  expect(await repo.remove('e-99'), 'remove("e-99")').toBe(false);
  expect(await repo.remove('e-02'), 'remove("e-02")').toBe(true);
  expect(await repo.list(), 'list() after remove("e-02")').toEqual([groceries]);
});

test('an expenses.json over maxBytes is refused with a RangeError before any byte is read', async () => {
  guard();
  const dir = await folder({ records: [groceries, pass, coffee, lunch] });
  const { error, events } = await instrument(() => repoOf(dir, 200).list());
  expect(error, 'list() with maxBytes 200 and a larger file').toBeInstanceOf(RangeError);
  expect(events.filter((e) => e.type === 'read').length, 'read calls before the refusal').toBe(0);
});

test('a save that would exceed maxBytes is refused with a RangeError and changes nothing', async () => {
  guard();
  const dir = await folder({ records: [groceries] });
  const before = await readFile(path.join(dir, 'expenses.json'), 'utf8');
  const limit = Buffer.byteLength(before) + 20; // room for the file as it is, not for one more record
  const { error } = await instrument(() => repoOf(dir, limit).save(pass));
  expect(error, `save(e-02) with maxBytes ${limit}`).toBeInstanceOf(RangeError);
  expect(await readFile(path.join(dir, 'expenses.json'), 'utf8'), 'expenses.json after the refused save').toBe(before);
});

test('a crash in the middle of save leaves the old records whole', async () => {
  guard();
  const dir = await folder({ records: [groceries] });
  const { error } = await instrument(() => repoOf(dir).save(pass), { crashWrites: true });
  expect(error !== undefined, 'save rejects when the write crashes').toBe(true);
  const text = await readFile(path.join(dir, 'expenses.json'), 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AssertionError(`after the crash expenses.json holds broken JSON: ${text}`, {});
  }
  expect(parsed.records, 'records after a crash while saving e-02').toEqual([groceries]);
});

test('save flushes a .tmp file in the same folder with sync() before renaming it', async () => {
  guard();
  const dir = await folder({ records: [groceries] });
  const { events, error } = await instrument(() => repoOf(dir).save(pass));
  if (error) throw error;
  const renames = events.filter((e) => e.type === 'rename');
  const target = path.resolve(dir, 'expenses.json');
  expect(renames.map((e) => e.to), 'rename targets during one save').toEqual([target]);
  expect(path.dirname(renames[0].from) === path.dirname(target) && renames[0].from.endsWith('.tmp'), `renamed from ${path.basename(renames[0].from)} in the same folder`).toBe(true);
  const types = events.map((e) => e.type);
  expect(types.slice(0, types.indexOf('rename')).includes('sync'), 'sync() before the rename').toBe(true);
});

test('a corrupt expenses.json rejects with the SyntaxError as cause', async () => {
  guard();
  const dir = await folder({ raw: '{"schemaVersion":1,"records":[{"id":"e-01",' });
  let error;
  try {
    await repoOf(dir).list();
  } catch (e) {
    error = e;
  }
  expect(error?.cause, 'cause of the rejection of list() for broken JSON').toBeInstanceOf(SyntaxError);
});

test('every FileHandle is closed after reads, saves, refusals and a corrupt file', async () => {
  guard();
  const good = await folder({ records: [groceries, pass] });
  const corrupt = await folder({ raw: '{"schemaVersion":1,' });
  const runs = {
    'list()': () => repoOf(good).list(),
    'save(e-03)': () => repoOf(good).save(coffee),
    'summary()': () => repoOf(good).summary(),
    'list() of a corrupt file': () => repoOf(corrupt).list(),
    'list() over the limit': () => repoOf(good, 100).list(),
  };
  for (const [what, run] of Object.entries(runs)) {
    const { stillOpen } = await instrument(run);
    expect(stillOpen, `FileHandles left open after ${what}`).toBe(0);
  }
});

test('summary() reads expenses.json and categories.json at the same time', async () => {
  guard();
  const dir = await folder({ records: [groceries, pass] });
  const { most, error } = await instrument(() => repoOf(dir).summary(), { slow: true });
  if (error) throw error;
  expect(most, 'file operations in progress at the same time during summary()').toBeGreaterThanOrEqual(2);
});

test('summary() totals amountMinor per category with its label', async () => {
  guard();
  const repo = repoOf(await folder({ records: [groceries, pass, coffee, lunch] }));
  expect(await repo.summary(), 'summary()').toEqual({
    food: { label: L.food, totalMinor: 105600 },
    transport: { label: L.transport, totalMinor: 52000 },
    fun: { label: L.fun, totalMinor: 18000 },
  });
});

test('recover() removes only .tmp files', async () => {
  guard();
  const dir = await folder({ records: [groceries] });
  await writeFile(path.join(dir, 'expenses.json.c3.tmp'), '{"schemaVersion":1,"rec');
  await repoOf(dir).recover();
  expect((await readdir(dir)).sort(), 'files after recover()').toEqual(['categories.json', 'expenses.json']);
  expect(await repoOf(dir).list(), 'list() after recover()').toEqual([groceries]);
});
