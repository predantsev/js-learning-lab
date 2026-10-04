import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { createReleaseRecord, verifyRelease } from './release.js';

const meta = { name: 'planner-service', version: '1.4.0', commit: 'a7ab36a', node: 'v22.23.3' };
const content = JSON.stringify({ files: { 'server.js': `// ${L.hello}\n`.repeat(40) } });
let cases = 0;

// A fresh artifact in its own folder: gzipped JSON, as a build would write it.
async function artifact(level = 6) {
  const file = tmp(`case-${++cases}/planner-service-1.4.0.bundle.gz`);
  const bytes = gzipSync(content, { level });
  await writeFile(file, bytes);
  return { file, bytes };
}
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const guard = () => {
  expect(typeof createReleaseRecord, 'type of createReleaseRecord').toBe('function');
  expect(typeof verifyRelease, 'type of verifyRelease').toBe('function');
};
async function reportOf(file) {
  try {
    return await verifyRelease(file);
  } catch (error) {
    return { thrown: `${error.name}: ${error.message}` };
  }
}

test('the record describes the exact bytes of the artifact', async () => {
  guard();
  const { file, bytes } = await artifact();
  const record = await createReleaseRecord(file, meta);
  expect(record, 'the record').toMatchObject({ ...meta, artifact: 'planner-service-1.4.0.bundle.gz', bytes: bytes.length, sha256: sha256(bytes) });
});

test('the record lists both verify commands with the file name', async () => {
  guard();
  const { file } = await artifact();
  const record = await createReleaseRecord(file, meta);
  expect([...(record?.verify ?? [])].sort(), 'record.verify').toEqual(['sha256sum planner-service-1.4.0.bundle.gz', 'shasum -a 256 planner-service-1.4.0.bundle.gz']);
});

test('the record is written next to the artifact', async () => {
  guard();
  const { file } = await artifact();
  const record = await createReleaseRecord(file, meta);
  const written = JSON.parse(await readFile(`${file}.release.json`, 'utf8'));
  expect(written, `the file ${path.basename(file)}.release.json`).toEqual(record);
});

test('a record without a commit is refused', async () => {
  guard();
  const { file } = await artifact();
  let message = '';
  try {
    await createReleaseRecord(file, { ...meta, commit: '' });
  } catch (error) {
    message = String(error?.message);
  }
  expect(message, 'the error for an empty commit').toContain('commit');
});

test('verifyRelease passes an untouched artifact', async () => {
  guard();
  const { file } = await artifact();
  await createReleaseRecord(file, meta);
  expect(await reportOf(file), 'the report').toEqual({ ok: true, problems: [] });
});

test('one changed byte is reported', async () => {
  guard();
  const { file, bytes } = await artifact();
  await createReleaseRecord(file, meta);
  const changed = Buffer.from(bytes);
  changed[changed.length - 6] ^= 1;
  await writeFile(file, changed);
  const report = await reportOf(file);
  expect(report.ok, `report.ok after one changed byte (report: ${JSON.stringify(report)})`).toBe(false);
  expect(report.problems?.length, 'number of problems').toBeGreaterThan(0);
});

test('a rebuild with the same content but other bytes is reported', async () => {
  guard();
  const { file } = await artifact(6);
  await createReleaseRecord(file, meta);
  await writeFile(file, gzipSync(content, { level: 1 }));
  const report = await reportOf(file);
  expect(report.ok, `report.ok for a rebuilt artifact (report: ${JSON.stringify(report)})`).toBe(false);
});

test('a missing record is reported, not thrown', async () => {
  guard();
  const { file } = await artifact();
  const report = await reportOf(file);
  expect(report.thrown ?? null, 'what verifyRelease threw').toBe(null);
  expect(report.ok, 'report.ok without a record').toBe(false);
});
