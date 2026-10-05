import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { withWriteLock } from './lock.js';
import { notesRepository } from './notes-repo.js';

let cases = 0;
async function freshStore(count) {
  const dir = tmp(`case-${++cases}`);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, 'notes.json');
  const records = Array.from({ length: count }, (_, i) => ({ id: `n-${i + 1}`, title: `${L.note} ${i + 1}`, pinned: false }));
  await writeFile(file, JSON.stringify({ schemaVersion: 1, records }));
  return file;
}

const guard = () => {
  expect(typeof withWriteLock, 'type of withWriteLock').toBe('function');
  expect(typeof notesRepository, 'type of notesRepository').toBe('function');
};

test('withWriteLock resolves with what fn returns', async () => {
  guard();
  expect(await withWriteLock(async () => 42), 'await withWriteLock(async () => 42)').toBe(42);
});

test('only one fn runs at a time', async () => {
  guard();
  let active = 0;
  let most = 0;
  const job = async () => {
    active += 1;
    most = Math.max(most, active);
    await sleep(10);
    active -= 1;
  };
  await Promise.all([1, 2, 3, 4, 5].map(() => withWriteLock(job)));
  expect(most, 'the most fns running at the same moment').toBe(1);
});

test('fns run in the order they were queued', async () => {
  guard();
  const order = [];
  const job = (name, ms) => async () => {
    await sleep(ms);
    order.push(name);
  };
  await Promise.all([withWriteLock(job('a', 30)), withWriteLock(job('b', 0)), withWriteLock(job('c', 10))]);
  expect(order, 'the order the fns finished').toEqual(['a', 'b', 'c']);
});

test('a failing fn rejects its own caller only, and the next fn still runs', async () => {
  guard();
  const failing = withWriteLock(async () => {
    throw new Error('disk full');
  });
  const next = withWriteLock(async () => 'next ran');
  let message = 'did not reject';
  try {
    await failing;
  } catch (error) {
    message = error.message;
  }
  expect(message, 'how the failing call ended').toBe('disk full');
  expect(await Promise.race([next, sleep(1000).then(() => 'still waiting after 1 s')]), 'the call queued after it').toBe('next ran');
});

test('20 concurrent updates of different notes all land', async () => {
  guard();
  const file = await freshStore(20);
  const repo = notesRepository(file);
  await Promise.all(Array.from({ length: 20 }, (_, i) => repo.updateNote(`n-${i + 1}`, { pinned: true })));
  const pinned = (await repo.list()).filter((note) => note.pinned).length;
  expect(pinned, 'pinned notes after 20 concurrent updates').toBe(20);
});

test('two concurrent updates of different fields of one note both land', async () => {
  guard();
  const file = await freshStore(3);
  const repo = notesRepository(file);
  await Promise.all([repo.updateNote('n-2', { title: L.renamed }), repo.updateNote('n-2', { pinned: true })]);
  const note = (await repo.list()).find((item) => item.id === 'n-2');
  expect(note, 'note n-2 after both updates').toEqual({ id: 'n-2', title: L.renamed, pinned: true });
});

test('updateNote resolves with the updated note', async () => {
  guard();
  const file = await freshStore(2);
  const repo = notesRepository(file);
  expect(await repo.updateNote('n-1', { pinned: true }), 'what updateNote resolves with').toEqual({ id: 'n-1', title: `${L.note} 1`, pinned: true });
});
