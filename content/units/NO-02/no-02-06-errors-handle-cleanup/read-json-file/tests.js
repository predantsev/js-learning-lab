// Checks for readJsonFile. `watch` wraps open from node:fs/promises (updating named imports with
// syncBuiltinESMExports) to see whether every FileHandle that was opened is closed afterwards.
import fsp, { mkdir, writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { readJsonFile } from './app.js';

const habits = [{ id: 'h-01', name: L.habit1, completions: ['2026-02-27', '2026-02-28'] }];

async function files() {
  const good = tmp('data/habits.json');
  const broken = tmp('data/broken.json');
  const folder = tmp('data/archive');
  await writeFile(good, JSON.stringify(habits));
  await writeFile(broken, '[{ "id": "h-02", ');
  await mkdir(folder, { recursive: true });
  return { good, broken, folder, missing: tmp('data/paused.json') };
}

async function watch(run) {
  const opened = [];
  const real = fsp.open;
  fsp.open = async (...args) => {
    const handle = await real(...args);
    opened.push(handle);
    return handle;
  };
  syncBuiltinESMExports();
  try {
    await run();
  } catch {
    // the outcome is checked by other tests; here only the handles matter
  } finally {
    fsp.open = real;
    syncBuiltinESMExports();
  }
  return opened.filter((handle) => handle.fd !== -1).length;
}

async function rejection(file) {
  expect(typeof readJsonFile, 'type of readJsonFile').toBe('function');
  let result;
  try {
    result = await readJsonFile(file);
  } catch (error) {
    return error;
  }
  throw new AssertionError(`readJsonFile resolved with ${JSON.stringify(result)}, but it must reject`, {});
}

test('an existing JSON file gives { status: "ok", value }', async () => {
  expect(typeof readJsonFile, 'type of readJsonFile').toBe('function');
  const { good } = await files();
  expect(await readJsonFile(good), 'readJsonFile(habits.json)').toEqual({ status: 'ok', value: habits });
});

test('a missing file gives { status: "missing" }', async () => {
  expect(typeof readJsonFile, 'type of readJsonFile').toBe('function');
  const { missing } = await files();
  expect(await readJsonFile(missing), 'readJsonFile(paused.json), which does not exist').toEqual({ status: 'missing' });
});

test('a folder rejects with the original fs error as cause', async () => {
  const { folder } = await files();
  const error = await rejection(folder);
  expect(error?.cause instanceof Error, 'cause of the rejection is an Error').toBe(true);
  expect(String(error.cause.code), 'cause.code (EISDIR on macOS and Linux)').toMatch(/^E[A-Z]+$/);
  expect(error.cause.code, 'cause.code').not.toBe('ENOENT');
});

test('broken JSON rejects with the SyntaxError as cause', async () => {
  const { broken } = await files();
  const error = await rejection(broken);
  expect(error?.cause, 'cause of the rejection for broken.json').toBeInstanceOf(SyntaxError);
});

test('the FileHandle is closed on every path', async () => {
  expect(typeof readJsonFile, 'type of readJsonFile').toBe('function');
  const { good, broken, folder } = await files();
  expect(await watch(() => readJsonFile(good)), 'handles left open after reading habits.json').toBe(0);
  expect(await watch(() => readJsonFile(broken)), 'handles left open after reading broken.json').toBe(0);
  expect(await watch(() => readJsonFile(folder)), 'handles left open after reading a folder').toBe(0);
});
