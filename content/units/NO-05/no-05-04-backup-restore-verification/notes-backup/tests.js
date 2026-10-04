import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { backupStore, verifyBackup } from './app.js';

const sha = (text) => createHash('sha256').update(text).digest('hex');
const storeText = () => JSON.stringify({
  schemaVersion: 1,
  records: [
    { id: 'n-01', title: L.shopping, body: '', pinned: true },
    { id: 'n-02', title: L.ideas, body: '', pinned: false },
    { id: 'n-03', title: L.plan, body: '', pinned: false },
  ],
});
let cases = 0;

// A fresh folder with notes.json, backups/ and scratch/.
async function setup(text = storeText()) {
  const dir = tmp(`case-${++cases}`);
  await mkdir(path.join(dir, 'backups'), { recursive: true });
  await mkdir(path.join(dir, 'scratch'), { recursive: true });
  await writeFile(path.join(dir, 'notes.json'), text);
  return { file: path.join(dir, 'notes.json'), backup: path.join(dir, 'backups', 'notes.1.json'), scratch: path.join(dir, 'scratch') };
}

// Writes a backup and its manifest directly, without the learner's backupStore.
async function plantBackup(where, text, manifest = { count: JSON.parse(text).records?.length ?? 0, sha256: sha(text) }) {
  await writeFile(where.backup, text);
  await writeFile(`${where.backup}.manifest.json`, JSON.stringify(manifest));
}

const guard = () => {
  expect(typeof backupStore, 'type of backupStore').toBe('function');
  expect(typeof verifyBackup, 'type of verifyBackup').toBe('function');
};

async function reportOf(where) {
  let report;
  let thrown = null;
  try {
    report = await verifyBackup(where.backup, where.scratch);
  } catch (error) {
    thrown = error;
  }
  expect(thrown === null, `verifyBackup returns without throwing (it threw: ${thrown?.message})`).toBe(true);
  return report;
}

test('backupStore copies the store and returns its count and sha256', async () => {
  guard();
  const where = await setup();
  const manifest = await backupStore(where.file, where.backup);
  expect(await readFile(where.backup, 'utf8'), 'the backup file').toBe(storeText());
  expect(manifest, 'what backupStore returns').toEqual({ count: 3, sha256: sha(storeText()) });
});

test('the manifest file holds the same count and sha256', async () => {
  guard();
  const where = await setup();
  await backupStore(where.file, where.backup);
  expect(JSON.parse(await readFile(`${where.backup}.manifest.json`, 'utf8')), 'the manifest file').toEqual({ count: 3, sha256: sha(storeText()) });
});

test('verifyBackup passes a good backup', async () => {
  guard();
  const where = await setup();
  await plantBackup(where, storeText());
  const report = await reportOf(where);
  expect(report, 'the report for a good backup').toEqual({ ok: true, count: 3, sha256: sha(storeText()), problems: [] });
});

test('verifyBackup restores into the scratch folder and changes nothing else', async () => {
  guard();
  const where = await setup();
  await plantBackup(where, storeText());
  const manifestBefore = await readFile(`${where.backup}.manifest.json`, 'utf8');
  await reportOf(where);
  expect(await readFile(path.join(where.scratch, 'restored.json'), 'utf8'), 'scratch/restored.json').toBe(storeText());
  expect(await readFile(where.backup, 'utf8'), 'the backup after verifying').toBe(storeText());
  expect(await readFile(`${where.backup}.manifest.json`, 'utf8'), 'the manifest after verifying').toBe(manifestBefore);
  expect((await readdir(path.dirname(where.backup))).sort(), 'files in backups/').toEqual(['notes.1.json', 'notes.1.json.manifest.json']);
});

test('a backup whose bytes changed is reported', async () => {
  guard();
  const where = await setup();
  await plantBackup(where, storeText());
  await writeFile(where.backup, storeText().replace(L.ideas, L.changed)); // still valid JSON, same count
  const report = await reportOf(where);
  expect(report?.ok, 'report.ok').toBe(false);
  expect(report?.problems?.length > 0, `report.problems: ${JSON.stringify(report?.problems)}`).toBe(true);
});

test('a backup that is not valid JSON is reported, not thrown', async () => {
  guard();
  const where = await setup();
  const torn = storeText().slice(0, 40);
  await plantBackup(where, storeText(), { count: 3, sha256: sha(torn) }); // the manifest matches the torn text
  await writeFile(where.backup, torn);
  const report = await reportOf(where);
  expect(report?.ok, 'report.ok').toBe(false);
});

test('a backup that breaks the contract is reported', async () => {
  guard();
  const where = await setup();
  const bad = storeText().replace(`"title":"${L.plan}"`, '"title":7');
  await plantBackup(where, bad); // the manifest describes exactly this text
  const report = await reportOf(where);
  expect(report?.ok, 'report.ok for a backup whose note has a numeric title').toBe(false);
});

test('a count that differs from the manifest is reported', async () => {
  guard();
  const where = await setup();
  await plantBackup(where, storeText(), { count: 4, sha256: sha(storeText()) });
  const report = await reportOf(where);
  expect(report?.ok, 'report.ok when the manifest says 4 and the backup has 3').toBe(false);
});

test('a backup without a manifest is reported', async () => {
  guard();
  const where = await setup();
  await plantBackup(where, storeText());
  await rm(`${where.backup}.manifest.json`);
  const report = await reportOf(where);
  expect(report?.ok, 'report.ok without a manifest').toBe(false);
});
