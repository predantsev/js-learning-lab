// Checks use only the exports of store.js, so a JSON file and an SQLite database both pass.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { backupStore, initStore, openRepository, verifyBackup } from './store.js';

const fixtures = () => [
  { id: 'k-01', room: 'A', date: '2026-03-02', guests: 2, note: L.quiet },
  { id: 'k-02', room: 'B', date: '2026-03-02', guests: 4, note: '' },
  { id: 'k-03', room: 'A', date: '2026-03-03', guests: 1, note: '' },
];
let cases = 0;
async function where() {
  const dir = tmp(`case-${++cases}`);
  await mkdir(path.join(dir, 'scratch'), { recursive: true });
  return { dir, file: path.join(dir, 'store', 'bookings'), backup: path.join(dir, 'bookings.backup'), scratch: path.join(dir, 'scratch') };
}
const ids = (list) => list.map((booking) => booking.id).sort();
const settle = (promise) => promise.then(() => 'ok', (error) => `rejected: ${error?.message}`);

async function opened(file) {
  const repo = await openRepository(file);
  return repo;
}
async function freshRepo() {
  const w = await where();
  await initStore(w.file, fixtures());
  return { ...w, repo: await opened(w.file) };
}

const guard = () => {
  for (const [name, fn] of Object.entries({ initStore, openRepository, backupStore, verifyBackup })) expect(typeof fn, `type of ${name}`).toBe('function');
};

test('initStore creates a missing store with the fixtures', async () => {
  guard();
  const w = await where();
  await initStore(w.file, fixtures());
  const repo = await opened(w.file);
  expect(await repo.list(), 'list() after initStore').toEqual(fixtures());
  await repo.close?.();
});

test('initStore twice gives the same store as once, and a store with bookings is not reseeded', async () => {
  guard();
  const { file, repo } = await freshRepo();
  await repo.add({ id: 'k-09', room: 'C', date: '2026-03-04', guests: 2 });
  await repo.close?.();
  await initStore(file, fixtures());
  await initStore(file, fixtures());
  const again = await opened(file);
  expect(ids(await again.list()), 'ids after two more initStore calls').toEqual(['k-01', 'k-02', 'k-03', 'k-09']);
  await again.close?.();
});

test('initStore refuses a damaged store and leaves it byte for byte', async () => {
  guard();
  for (const damaged of ['{"schemaVersion":1,"records":[{"id":"k-0', JSON.stringify({ schemaVersion: 1, records: [{ id: 'k-01', room: 'Z', date: 'soon', guests: 0 }] })]) {
    const w = await where();
    await mkdir(path.dirname(w.file), { recursive: true });
    await writeFile(w.file, damaged);
    const outcome = await settle(initStore(w.file, fixtures()));
    expect(outcome.startsWith('rejected'), `initStore of ${damaged.slice(0, 30)}…`).toBe(true);
    expect(await readFile(w.file, 'utf8'), 'the store file afterwards').toBe(damaged);
  }
});

test('add fills the default note and rejects a booking that breaks the contract', async () => {
  guard();
  const { repo } = await freshRepo();
  expect(await repo.add({ id: 'k-10', room: 'C', date: '2026-03-06', guests: 3 }), 'add without a note').toEqual({ id: 'k-10', room: 'C', date: '2026-03-06', guests: 3, note: '' });
  const bad = [
    { id: 'k-11', room: 'D', date: '2026-03-06', guests: 1 },
    { id: 'k-12', room: 'B', date: '6 March', guests: 1 },
    { id: 'k-13', room: 'B', date: '2026-03-07', guests: 9 },
    { id: 'k-14', room: 'B', date: '2026-03-08', guests: '2' },
    { id: 'k-15', room: 'B', date: '2026-03-09', guests: 2, colour: 'red' },
  ];
  for (const booking of bad) {
    expect((await settle(repo.add(booking))).startsWith('rejected'), `add(${JSON.stringify(booking)})`).toBe(true);
  }
  expect(ids(await repo.list()), 'ids after the rejected adds').toEqual(['k-01', 'k-02', 'k-03', 'k-10']);
  await repo.close?.();
});

test('30 concurrent adds all land and survive a restart', async () => {
  guard();
  const { file, repo } = await freshRepo();
  const many = Array.from({ length: 30 }, (_, i) => ({ id: `k-${100 + i}`, room: 'ABC'[i % 3], date: `2026-04-${String(1 + Math.floor(i / 3)).padStart(2, '0')}`, guests: 1 + (i % 8) }));
  const outcomes = await Promise.all(many.map((booking) => settle(repo.add(booking))));
  expect(outcomes.filter((outcome) => outcome === 'ok').length, `confirmed adds (${outcomes.find((o) => o !== 'ok') ?? 'all ok'})`).toBe(30);
  await repo.close?.();
  const restarted = await opened(file);
  expect((await restarted.list()).length, 'bookings after a restart').toBe(33);
  await restarted.close?.();
});

test('two concurrent adds for one room and day: exactly one is confirmed', async () => {
  guard();
  const { repo } = await freshRepo();
  const outcomes = await Promise.all([
    settle(repo.add({ id: 'k-20', room: 'C', date: '2026-03-05', guests: 1 })),
    settle(repo.add({ id: 'k-21', room: 'C', date: '2026-03-05', guests: 2 })),
  ]);
  expect(outcomes.filter((outcome) => outcome === 'ok').length, `confirmed of the two (${outcomes.join(' | ')})`).toBe(1);
  expect((await repo.list()).filter((booking) => booking.room === 'C' && booking.date === '2026-03-05').length, 'bookings of room C on 2026-03-05').toBe(1);
  await repo.close?.();
});

test('two concurrent updates of different fields of one booking both land', async () => {
  guard();
  const { repo } = await freshRepo();
  await Promise.all([repo.update('k-02', { guests: 6 }), repo.update('k-02', { note: L.late })]);
  expect((await repo.list()).find((booking) => booking.id === 'k-02'), 'booking k-02').toEqual({ id: 'k-02', room: 'B', date: '2026-03-02', guests: 6, note: L.late });
  await repo.close?.();
});

test('an update that would double-book a room is rejected and changes nothing', async () => {
  guard();
  const { repo } = await freshRepo();
  expect((await settle(repo.update('k-03', { date: '2026-03-02' }))).startsWith('rejected'), 'moving k-03 to room A on 2026-03-02').toBe(true);
  expect(await repo.list(), 'the bookings afterwards').toEqual(fixtures());
  await repo.close?.();
});

test('backupStore returns { count, sha256 } and writes the manifest next to the backup', async () => {
  guard();
  const { file, backup, repo } = await freshRepo();
  await repo.close?.();
  const manifest = await backupStore(file, backup);
  expect(manifest?.count, 'manifest.count').toBe(3);
  expect(/^[0-9a-f]{64}$/.test(manifest?.sha256 ?? ''), `manifest.sha256 is 64 hex characters (${manifest?.sha256})`).toBe(true);
  expect(JSON.parse(await readFile(`${backup}.manifest.json`, 'utf8')), 'the manifest file').toEqual(manifest);
});

test('verifyBackup passes a good backup and restores it only into the scratch folder', async () => {
  guard();
  const { dir, file, backup, scratch, repo } = await freshRepo();
  await repo.close?.();
  await backupStore(file, backup);
  const report = await verifyBackup(backup, scratch);
  expect(report, 'the report').toMatchObject({ ok: true, count: 3, problems: [] });
  expect((await readdir(scratch)).length > 0, 'something was restored into scratch').toBe(true);
  expect((await readdir(dir)).sort(), 'files next to the backup').toEqual(['bookings.backup', 'bookings.backup.manifest.json', 'scratch', 'store']);
});

test('verifyBackup reports a backup with one changed byte, and a missing manifest, without throwing', async () => {
  guard();
  const { file, backup, scratch, repo } = await freshRepo();
  await repo.close?.();
  await backupStore(file, backup);
  const original = await readFile(backup);
  const bytes = Buffer.from(original);
  const at = bytes.indexOf(Buffer.from(L.quiet)); // a byte inside the note text: still valid data, same count
  expect(at >= 0, 'the note of k-01 is found in the backup bytes').toBe(true);
  bytes[at + 1] ^= 0x01;
  await writeFile(backup, bytes);
  const changed = await verifyBackup(backup, scratch).catch((error) => ({ threw: error.message }));
  expect(changed?.ok, `report for a changed byte: ${JSON.stringify(changed)}`).toBe(false);
  await writeFile(backup, original);
  await rm(`${backup}.manifest.json`);
  const missing = await verifyBackup(backup, scratch).catch((error) => ({ threw: error.message }));
  expect(missing?.ok, `report without a manifest: ${JSON.stringify(missing)}`).toBe(false);
});
