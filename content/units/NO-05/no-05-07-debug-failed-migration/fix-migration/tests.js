import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { migrateBook, recoverAndUpgrade, upgrade } from './migrate.js';

const books = () => [
  { id: 'b-01', title: L.b1, pages: '312', finished: 'yes' },
  { id: 'b-02', title: L.b2, pages: '96', finished: 'no' },
  { id: 'b-03', title: L.b3, pages: ' 450 ', finished: 'no' },
  { id: 'b-04', title: L.b4, pages: 280, finished: 'yes' },
];
const migrated = () => [
  { id: 'b-01', title: L.b1, pages: 312, finished: true },
  { id: 'b-02', title: L.b2, pages: 96, finished: false },
  { id: 'b-03', title: L.b3, pages: 450, finished: false },
  { id: 'b-04', title: L.b4, pages: 280, finished: true },
];
const v1Text = (records = books()) => JSON.stringify({ schemaVersion: 1, records });
let cases = 0;

async function folder(liveText, { backup = v1Text(), manifestSha } = {}) {
  const dir = tmp(`case-${++cases}`);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, 'reading.json');
  await writeFile(file, liveText);
  const backupPath = path.join(dir, 'reading.v1.json');
  await writeFile(backupPath, backup);
  const sha256 = manifestSha ?? createHash('sha256').update(backup).digest('hex');
  await writeFile(`${backupPath}.manifest.json`, JSON.stringify({ count: JSON.parse(backup).records.length, sha256 }));
  return { dir, file, backupPath };
}
// What a migration that crashed on b-04 leaves: version 2, three migrated books and one old one.
const halfMigrated = () => JSON.stringify({ schemaVersion: 2, records: [...migrated().slice(0, 3), books()[3]] });
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

const guard = () => {
  for (const [name, fn] of Object.entries({ migrateBook, upgrade, recoverAndUpgrade })) expect(typeof fn, `type of ${name}`).toBe('function');
};

test('migrateBook converts pages to a number and finished to a boolean', () => {
  guard();
  expect(books().map((book) => migrateBook(book)), 'migrateBook of the four books').toEqual(migrated());
});

test('migrateBook does not change the book it gets', () => {
  guard();
  const book = books()[0];
  migrateBook(book);
  expect(book, 'the book after migrateBook').toEqual(books()[0]);
});

test('migrateBook throws for pages that are not a whole number', () => {
  guard();
  let threw = false;
  try {
    migrateBook({ id: 'b-09', title: L.b1, pages: L.about, finished: 'no' });
  } catch {
    threw = true;
  }
  expect(threw, `migrateBook throws for pages "${L.about}"`).toBe(true);
});

test('upgrade migrates a v1 file to v2', async () => {
  guard();
  const { file } = await folder(v1Text());
  expect(await upgrade(file), 'what upgrade resolves with').toBe('migrated');
  expect(await readJson(file), 'the file after upgrade').toEqual({ schemaVersion: 2, records: migrated() });
});

test('upgrade of a v2 file changes nothing', async () => {
  guard();
  const v2 = JSON.stringify({ schemaVersion: 2, records: migrated() });
  const { file } = await folder(v2);
  expect(await upgrade(file), 'what upgrade resolves with').toBe('already');
  expect(await readFile(file, 'utf8'), 'the file afterwards').toBe(v2);
});

test('when a book cannot be migrated, upgrade rejects and the file stays v1 byte for byte', async () => {
  guard();
  const records = books();
  records.splice(2, 0, { id: 'b-05', title: L.b5, pages: L.about, finished: 'no' });
  const text = v1Text(records);
  const { file } = await folder(text);
  let rejected = false;
  try {
    await upgrade(file);
  } catch {
    rejected = true;
  }
  expect(rejected, 'upgrade rejects').toBe(true);
  expect(await readFile(file, 'utf8'), 'the file after the failed upgrade').toBe(text);
});

test('recoverAndUpgrade leaves a valid v2 store alone', async () => {
  guard();
  const v2 = JSON.stringify({ schemaVersion: 2, records: migrated() });
  const { file, dir } = await folder(v2);
  expect(await recoverAndUpgrade(file, path.join(dir, 'reading.v1.json')), 'what recoverAndUpgrade resolves with').toBe('ok');
  expect(await readFile(file, 'utf8'), 'the file afterwards').toBe(v2);
});

test('recoverAndUpgrade restores a half-migrated store from the verified backup and migrates it', async () => {
  guard();
  const { file, backupPath } = await folder(halfMigrated());
  expect(await recoverAndUpgrade(file, backupPath), 'what recoverAndUpgrade resolves with').toBe('recovered');
  expect(await readJson(file), 'the file afterwards').toEqual({ schemaVersion: 2, records: migrated() });
});

test('the half-migrated store is kept as reading.json.half-migrated', async () => {
  guard();
  const { file, backupPath } = await folder(halfMigrated());
  await recoverAndUpgrade(file, backupPath);
  expect(await readFile(`${file}.half-migrated`, 'utf8').catch(() => 'no such file'), 'reading.json.half-migrated').toBe(halfMigrated());
});

test('without a verified backup recoverAndUpgrade rejects and keeps the store', async () => {
  guard();
  const { file, backupPath, dir } = await folder(halfMigrated(), { manifestSha: 'not-the-sha' });
  let rejected = false;
  try {
    await recoverAndUpgrade(file, backupPath);
  } catch {
    rejected = true;
  }
  expect(rejected, 'recoverAndUpgrade rejects').toBe(true);
  expect(await readFile(file, 'utf8'), 'reading.json afterwards').toBe(halfMigrated());
  expect((await readdir(dir)).sort(), 'files in the folder').toEqual(['reading.json', 'reading.v1.json', 'reading.v1.json.manifest.json']);
});
