// Checks for writeAtomic and removeStaleTemps. `instrument` wraps functions of node:fs/promises and
// methods of FileHandle (updating named imports with syncBuiltinESMExports) to record calls and,
// for the crash check, to make every write stop half-way with an error, like a crash.
import fsp, { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { syncBuiltinESMExports } from 'node:module';
import { removeStaleTemps, writeAtomic } from './app.js';

// Every FileHandle opened during the checks stays referenced here until the process ends, so a
// handle that was never closed is not closed by the garbage collector in the middle of a later check.
const retained = [];


const oldData = { schemaVersion: 1, records: [{ id: 'w-02', name: L.lamp, acquired: false }] };
const newData = { schemaVersion: 1, records: [{ id: 'w-02', name: L.lamp, acquired: true }] };
let folders = 0;

async function freshFolder() {
  const dir = tmp(`case-${++folders}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

async function instrument(run, { crashWrites = false } = {}) {
  const probe = await fsp.open(tmp('probe.txt'), 'w');
  const proto = Object.getPrototypeOf(probe);
  await probe.close();
  const events = [];
  const opened = [];
  const real = { open: fsp.open, rename: fsp.rename, writeFile: fsp.writeFile };
  const realMethods = { sync: proto.sync, datasync: proto.datasync, write: proto.write, writeFile: proto.writeFile };
  const half = (data) => {
    const bytes = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    return bytes.subarray(0, Math.floor(bytes.length / 2));
  };
  fsp.open = async (...args) => {
    const handle = await real.open(...args);
    opened.push(handle);
    retained.push(handle);
    return handle;
  };
  fsp.rename = async (from, to) => {
    events.push({ type: 'rename', from: path.resolve(String(from)), to: path.resolve(String(to)) });
    return real.rename(from, to);
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
  return { ...outcome, events, stillOpen: opened.filter((h) => h.fd !== -1).length };
}

const guard = () => {
  expect(typeof writeAtomic, 'type of writeAtomic').toBe('function');
  expect(typeof removeStaleTemps, 'type of removeStaleTemps').toBe('function');
};

test('the target holds the new value as JSON afterwards', async () => {
  guard();
  const target = path.join(await freshFolder(), 'wishlist.json');
  await writeAtomic(target, oldData);
  await writeAtomic(target, newData);
  expect(JSON.parse(await readFile(target, 'utf8')), 'JSON.parse of the target after two saves').toEqual(newData);
});

test('a .tmp file in the same folder is renamed over the target', async () => {
  guard();
  const target = path.join(await freshFolder(), 'wishlist.json');
  const { events, error } = await instrument(() => writeAtomic(target, newData));
  if (error) throw error;
  const renames = events.filter((e) => e.type === 'rename');
  expect(renames.length, 'rename calls during one save').toBe(1);
  expect(renames[0].to, 'the rename target').toBe(path.resolve(target));
  expect(path.dirname(renames[0].from), 'the folder of the renamed temp file').toBe(path.dirname(path.resolve(target)));
  expect(renames[0].from.endsWith('.tmp'), `the temp name ${path.basename(renames[0].from)} ends with .tmp`).toBe(true);
});

test('the temp file is flushed with sync() before the rename', async () => {
  guard();
  const target = path.join(await freshFolder(), 'wishlist.json');
  const { events, error } = await instrument(() => writeAtomic(target, newData));
  if (error) throw error;
  const types = events.map((e) => e.type);
  const renameAt = types.indexOf('rename');
  expect(renameAt >= 0 && types.slice(0, renameAt).includes('sync'), `calls in order: ${types.join(', ') || 'none'}`).toBe(true);
});

test('every FileHandle it opens is closed', async () => {
  guard();
  const target = path.join(await freshFolder(), 'wishlist.json');
  const { stillOpen, error } = await instrument(() => writeAtomic(target, newData));
  if (error) throw error;
  expect(stillOpen, 'FileHandles left open after one save').toBe(0);
  const crashed = await instrument(() => writeAtomic(target, oldData), { crashWrites: true });
  expect(crashed.stillOpen, 'FileHandles left open after a save whose write failed').toBe(0);
});

test('a crash in the middle of writing leaves the old file whole', async () => {
  guard();
  const target = path.join(await freshFolder(), 'wishlist.json');
  await writeAtomic(target, oldData);
  const { error } = await instrument(() => writeAtomic(target, newData), { crashWrites: true });
  expect(error !== undefined, 'writeAtomic rejects when the write crashes').toBe(true);
  const text = await readFile(target, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AssertionError(`after the crash the target holds broken JSON: ${text}`, {});
  }
  expect(parsed, 'the target after a crash while saving the new value').toEqual(oldData);
});

test('two saves at the same time both succeed', async () => {
  guard();
  const target = path.join(await freshFolder(), 'wishlist.json');
  const results = await Promise.allSettled([writeAtomic(target, oldData), writeAtomic(target, newData)]);
  const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.code ?? r.reason?.message);
  expect(failed, 'errors of two simultaneous saves').toEqual([]);
  const saved = JSON.parse(await readFile(target, 'utf8'));
  expect([JSON.stringify(oldData), JSON.stringify(newData)], 'the target holds one complete value').toContain(JSON.stringify(saved));
});

test('removeStaleTemps deletes only the .tmp files', async () => {
  guard();
  const dir = await freshFolder();
  await writeFile(path.join(dir, 'wishlist.json'), JSON.stringify(oldData));
  await writeFile(path.join(dir, 'notes.txt'), 'keep');
  await writeFile(path.join(dir, 'wishlist.json.a1.tmp'), '{"sche');
  await writeFile(path.join(dir, 'planner.json.b2.tmp'), '');
  await removeStaleTemps(dir);
  expect((await readdir(dir)).sort(), 'files left in the folder').toEqual(['notes.txt', 'wishlist.json']);
});
