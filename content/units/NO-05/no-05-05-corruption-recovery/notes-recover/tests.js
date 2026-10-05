import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { recoverStore } from './app.js';

const titles = () => [L.shopping, L.ideas, L.plan, L.call];
const storeOf = (ids, broken = {}) => JSON.stringify({
  schemaVersion: 1,
  records: ids.map((id, i) => ({ id, title: broken[id] ?? titles()[i % 4], body: '', pinned: false })),
});
const sha = (text) => createHash('sha256').update(text).digest('hex');
const STAMP = '2026-03-04T08-00';
let cases = 0;

// A fresh folder: notes.json (unless text is null) and backups/ with the given backups.
async function setup(text, backups = {}) {
  const dir = tmp(`case-${++cases}`);
  const backupsDir = path.join(dir, 'backups');
  await mkdir(backupsDir, { recursive: true });
  const file = path.join(dir, 'notes.json');
  if (text !== null) await writeFile(file, text);
  for (const [name, { body, manifest }] of Object.entries(backups)) {
    await writeFile(path.join(backupsDir, name), body);
    await writeFile(path.join(backupsDir, `${name}.manifest.json`), JSON.stringify(manifest));
  }
  return { dir, file, backupsDir };
}
const good = (ids) => {
  const body = storeOf(ids);
  return { body, manifest: { count: ids.length, sha256: sha(body) } };
};
const twoBackups = () => ({ 'notes.2026-03-01.json': good(['n-01']), 'notes.2026-03-02.json': good(['n-01', 'n-02']) });

const guard = () => expect(typeof recoverStore, 'type of recoverStore').toBe('function');

test('a valid store is reported as ok and left alone', async () => {
  guard();
  const text = storeOf(['n-01', 'n-02', 'n-03']);
  const where = await setup(text, twoBackups());
  expect(await recoverStore(where.file, where.backupsDir, STAMP), 'the result for a valid store').toEqual({ action: 'ok', count: 3 });
  expect(await readFile(where.file, 'utf8'), 'notes.json afterwards').toBe(text);
  expect((await readdir(where.dir)).sort(), 'files in the folder').toEqual(['backups', 'notes.json']);
});

test('a missing store is reported as missing and nothing is written', async () => {
  guard();
  const where = await setup(null, twoBackups());
  expect(await recoverStore(where.file, where.backupsDir, STAMP), 'the result without notes.json').toEqual({ action: 'missing' });
  expect(await readdir(where.dir), 'files in the folder').toEqual(['backups']);
});

test('a torn store is quarantined with its bytes, not deleted', async () => {
  guard();
  const torn = storeOf(['n-01', 'n-02', 'n-03']).slice(0, 60);
  const where = await setup(torn, twoBackups());
  const result = await recoverStore(where.file, where.backupsDir, STAMP);
  const quarantined = `${where.file}.corrupt-${STAMP}`;
  expect(await readFile(quarantined, 'utf8').catch(() => 'no quarantine file'), `content of ${path.basename(quarantined)}`).toBe(torn);
  expect(result?.quarantined, 'result.quarantined').toBe(quarantined);
});

test('the newest verified backup is restored', async () => {
  guard();
  const where = await setup(storeOf(['n-01', 'n-02']).slice(0, 30), twoBackups());
  const result = await recoverStore(where.file, where.backupsDir, STAMP);
  expect(await readFile(where.file, 'utf8'), 'notes.json after the recovery').toBe(storeOf(['n-01', 'n-02']));
  expect(result, 'the result').toMatchObject({ action: 'restored', restoredFrom: 'notes.2026-03-02.json', count: 2 });
});

test('a newest backup that fails verification is skipped', async () => {
  guard();
  const backups = twoBackups();
  backups['notes.2026-03-03.json'] = { body: storeOf(['n-01', 'n-02', 'n-03']).slice(0, 40), manifest: { count: 3, sha256: 'x' } };
  const where = await setup('{"schemaVersion":1,"rec', backups);
  const result = await recoverStore(where.file, where.backupsDir, STAMP);
  expect(result?.restoredFrom, 'result.restoredFrom when notes.2026-03-03.json is broken').toBe('notes.2026-03-02.json');
  expect(await readFile(where.file, 'utf8'), 'notes.json after the recovery').toBe(storeOf(['n-01', 'n-02']));
});

test('a store that breaks the contract is recovered too', async () => {
  guard();
  const where = await setup(storeOf(['n-01', 'n-02'], { 'n-02': 7 }), twoBackups());
  const result = await recoverStore(where.file, where.backupsDir, STAMP);
  expect(result?.action, 'result.action for a note whose title is a number').toBe('restored');
  expect(await readFile(where.file, 'utf8'), 'notes.json after the recovery').toBe(storeOf(['n-01', 'n-02']));
});

test('the report lists the notes missing from the backup', async () => {
  guard();
  const parsable = await setup(storeOf(['n-04', 'n-01', 'n-03', 'n-02'], { 'n-04': 7 }), twoBackups());
  const result = await recoverStore(parsable.file, parsable.backupsDir, STAMP);
  expect(result?.notInBackup, 'notInBackup for a readable but invalid store').toEqual(['n-03', 'n-04']);
  const torn = await setup('{"schemaVersion":1,"records":[{"id":"n-0', twoBackups());
  const tornResult = await recoverStore(torn.file, torn.backupsDir, STAMP);
  expect(tornResult?.notInBackup, 'notInBackup for cut-off JSON').toBe(null);
});

test('without a verified backup it refuses and leaves the store in place', async () => {
  guard();
  const torn = '{"schemaVersion":1,"records":[{"id":"n-0';
  const where = await setup(torn, { 'notes.2026-03-02.json': { body: storeOf(['n-01']), manifest: { count: 1, sha256: 'wrong' } } });
  let rejected = false;
  try {
    await recoverStore(where.file, where.backupsDir, STAMP);
  } catch {
    rejected = true;
  }
  expect(rejected, 'recoverStore rejects').toBe(true);
  expect(await readFile(where.file, 'utf8').catch(() => 'notes.json is gone'), 'notes.json afterwards').toBe(torn);
  expect((await readdir(where.dir)).sort(), 'files in the folder').toEqual(['backups', 'notes.json']);
});
