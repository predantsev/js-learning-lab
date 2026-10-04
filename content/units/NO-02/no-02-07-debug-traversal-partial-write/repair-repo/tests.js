// Checks for the repaired repository. `instrument` wraps functions of node:fs/promises and methods of
// FileHandle (updating named imports with syncBuiltinESMExports) to record every path that is read
// and, for the crash check, to stop every write half-way with an error, like a crash.
import fsp, { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { syncBuiltinESMExports } from 'node:module';
import { createRepo } from './repo.js';

const note = 'Лійка стоїть на балконі. Полити до 2026-03-02 ₴0 🌱';
const oldTasks = [{ id: 't-01', title: L.task1, dueDate: '2026-03-02', done: false, priority: 'normal' }];
const newTasks = [{ ...oldTasks[0], done: true }, { id: 't-02', title: L.task2, dueDate: '2026-03-01', done: false, priority: 'high' }];
let cases = 0;

async function setup() {
  const root = tmp(`case-${++cases}`);
  const dataDir = path.join(root, 'data');
  await mkdir(path.join(dataDir, 'archive'), { recursive: true });
  await writeFile(path.join(root, 'secret.txt'), 'API_KEY=example-not-real');
  await writeFile(path.join(dataDir, 't-01.txt'), note);
  await writeFile(path.join(dataDir, 'archive', 't-04.txt'), 'archived');
  await writeFile(path.join(dataDir, 't-05.txt'), 'call at 10:00');
  return { root, dataDir, repo: createRepo(dataDir) };
}

async function instrument(run, { crashWrites = false } = {}) {
  const probe = await fsp.open(tmp('probe.txt'), 'w');
  const proto = Object.getPrototypeOf(probe);
  await probe.close();
  const readPaths = [];
  const real = { open: fsp.open, readFile: fsp.readFile, writeFile: fsp.writeFile };
  const realMethods = { write: proto.write, writeFile: proto.writeFile };
  const half = (data) => {
    const bytes = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    return bytes.subarray(0, Math.floor(bytes.length / 2));
  };
  fsp.open = (file, ...rest) => {
    readPaths.push(path.resolve(String(file)));
    return real.open(file, ...rest);
  };
  fsp.readFile = (file, ...rest) => {
    readPaths.push(path.resolve(String(file)));
    return real.readFile(file, ...rest);
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
  return { ...outcome, readPaths };
}

const guard = () => expect(typeof createRepo, 'type of createRepo').toBe('function');

test('readNote rejects names that lead outside data/ and never reads there', async () => {
  guard();
  const { root, dataDir, repo } = await setup();
  const secret = path.join(root, 'secret.txt');
  for (const name of ['archive/../../secret.txt', secret, '....//secret.txt']) {
    const { error, value, readPaths } = await instrument(() => repo.readNote(name));
    const outside = readPaths.filter((p) => !p.startsWith(path.resolve(dataDir) + path.sep));
    expect(outside.map((p) => path.relative(root, p)), `files outside data/ read for readNote(${JSON.stringify(name)})`).toEqual([]);
    expect(error !== undefined && value === undefined, `readNote(${JSON.stringify(name)}) rejects`).toBe(true);
  }
});

test('readNote still reads notes inside data/', async () => {
  guard();
  const { repo } = await setup();
  expect(await repo.readNote('archive/t-04.txt'), 'readNote("archive/t-04.txt")').toBe('archived');
  expect(await repo.readNote('archive/../t-05.txt'), 'readNote("archive/../t-05.txt")').toBe('call at 10:00');
});

test('readNote decodes a Ukrainian note as UTF-8', async () => {
  guard();
  const { repo } = await setup();
  expect(await repo.readNote('t-01.txt'), 'readNote("t-01.txt")').toBe(note);
});

test('saveRecords then loadRecords gives the new records', async () => {
  guard();
  const { repo } = await setup();
  await repo.saveRecords(oldTasks);
  await repo.saveRecords(newTasks);
  expect(await repo.loadRecords(), 'loadRecords() after two saves').toEqual(newTasks);
});

test('a crash in the middle of saveRecords leaves the old records whole', async () => {
  guard();
  const { dataDir, repo } = await setup();
  await repo.saveRecords(oldTasks);
  const { error } = await instrument(() => repo.saveRecords(newTasks), { crashWrites: true });
  expect(error !== undefined, 'saveRecords rejects when the write crashes').toBe(true);
  const text = await readFile(path.join(dataDir, 'planner.json'), 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AssertionError(`after the crash planner.json holds broken JSON: ${text}`, {});
  }
  expect(parsed.records, 'records in planner.json after a crash while saving').toEqual(oldTasks);
});
