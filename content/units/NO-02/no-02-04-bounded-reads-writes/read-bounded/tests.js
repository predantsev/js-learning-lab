// Checks for readBounded. `watch` wraps open and readFile from node:fs/promises and the read methods of
// FileHandle (updating named imports with syncBuiltinESMExports) to see which handles were opened,
// whether they were closed, and whether any bytes were read.
import fsp, { writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { readBounded } from './app.js';

async function watch(run) {
  const probe = await fsp.open(tmp('probe.txt'), 'w');
  const proto = Object.getPrototypeOf(probe);
  await probe.close();
  const opened = [];
  let reads = 0;
  const realOpen = fsp.open;
  const realReadFile = fsp.readFile;
  const realMethods = { read: proto.read, readv: proto.readv, readFile: proto.readFile };
  fsp.open = async (...args) => {
    const handle = await realOpen(...args);
    opened.push(handle);
    return handle;
  };
  fsp.readFile = (...args) => {
    reads += 1;
    return realReadFile(...args);
  };
  for (const [name, method] of Object.entries(realMethods)) {
    proto[name] = function counted(...args) {
      reads += 1;
      return method.apply(this, args);
    };
  }
  syncBuiltinESMExports();
  let outcome;
  try {
    outcome = { value: await run() };
  } catch (error) {
    outcome = { error };
  } finally {
    fsp.open = realOpen;
    fsp.readFile = realReadFile;
    Object.assign(proto, realMethods);
    syncBuiltinESMExports();
  }
  return { ...outcome, reads, stillOpen: opened.filter((h) => h.fd !== -1).length, opened: opened.length };
}

async function fileOf(name, size) {
  const file = tmp(name);
  await writeFile(file, Buffer.alloc(size, 'h'));
  return file;
}

test('returns the whole content of a file larger than one chunk', async () => {
  expect(typeof readBounded, 'type of readBounded').toBe('function');
  const file = tmp('habits.txt');
  const content = Buffer.from(`${L.habit} 2026-03-01\n`.repeat(12_000)); // more than 200 KB
  await writeFile(file, content);
  const result = await readBounded(file, 1024 * 1024);
  expect(Buffer.isBuffer(result), 'the result is a Buffer').toBe(true);
  expect(result.length, 'bytes returned').toBe(content.length);
  expect(result.equals(content), 'the bytes equal the file').toBe(true);
});

test('a file of exactly maxBytes is allowed', async () => {
  expect(typeof readBounded, 'type of readBounded').toBe('function');
  const file = await fileOf('exact.txt', 5000);
  const result = await readBounded(file, 5000);
  expect(result?.length, 'bytes returned for a 5000-byte file with maxBytes 5000').toBe(5000);
});

test('a file over the limit rejects with a RangeError', async () => {
  expect(typeof readBounded, 'type of readBounded').toBe('function');
  const file = await fileOf('big.txt', 5001);
  const { error } = await watch(() => readBounded(file, 5000));
  expect(error, 'the rejection for a 5001-byte file with maxBytes 5000').toBeInstanceOf(RangeError);
});

test('an oversized file is refused before any byte is read', async () => {
  expect(typeof readBounded, 'type of readBounded').toBe('function');
  const file = await fileOf('huge.txt', 300_000);
  const { reads } = await watch(() => readBounded(file, 1000));
  expect(reads, 'read calls for a 300000-byte file with maxBytes 1000').toBe(0);
});

test('every opened FileHandle is closed, on success and on refusal', async () => {
  expect(typeof readBounded, 'type of readBounded').toBe('function');
  const small = await fileOf('small.txt', 100);
  const big = await fileOf('too-big.txt', 2000);
  const ok = await watch(() => readBounded(small, 1000));
  expect(ok.stillOpen, 'handles left open after reading a small file').toBe(0);
  const refused = await watch(() => readBounded(big, 1000));
  expect(refused.stillOpen, 'handles left open after refusing a big file').toBe(0);
});
