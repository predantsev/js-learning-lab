// Full-profile backup and restore (REQ-025): round trip, preview without changes, corruption,
// newer schema, unsafe ids, and a failed apply that leaves the original data intact.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { after, before, beforeEach, test } from 'node:test';
import { applyBackup, canonicalJson, checksumOf } from '../../server/api/backup.mjs';
import { api, startTestServer } from './helpers.mjs';

let ctx;
before(async () => {
  ctx = await startTestServer();
});
after(async () => {
  await ctx?.close();
});

const store = () => ctx.server.store;
async function reset(docs) {
  for (const { id } of await store().list()) await store().remove(id);
  for (const [id, data] of Object.entries(docs)) await store().put(id, data, { force: true });
}
const snapshotOfData = async () => Object.fromEntries(await Promise.all((await store().list()).map(async ({ id }) => [id, (await store().get(id)).data])));
const sample = {
  profile: { lang: 'uk', selectedStyleId: 'calm-studio', activeProjectId: 'p1' },
  'workspace/p1': { capstone: 'wishlist', files: { 'src/index.js': 'console.log("v1")' } },
  'progress/js-01': { status: 'completed', evidence: ['self-check'] },
};

beforeEach(async () => {
  await reset(sample);
});

test('create → wipe → apply(replace) restores every document', async () => {
  const created = await api(ctx, 'POST', '/api/backup/create');
  assert.equal(created.status, 200);
  const backup = created.json;
  assert.equal(backup.format, 'jsll-backup');
  assert.equal(backup.formatVersion, 1);
  assert.equal(backup.schemaVersion, 1);
  assert.deepEqual(backup.docs.map((d) => d.id), Object.keys(sample).sort());
  assert.equal(backup.checksum, checksumOf(backup.docs));
  assert.ok(!created.text.includes(ctx.token), 'no API token in a backup');
  assert.ok(!created.text.includes(ctx.server.config.dataDir), 'no machine paths in a backup');

  await reset({ profile: { lang: 'en' }, 'workspace/p2': { capstone: 'planner' } });
  const revBefore = (await store().get('profile')).rev;
  const applied = await api(ctx, 'POST', '/api/backup/apply', { backup, mode: 'replace' });
  assert.equal(applied.status, 200, applied.text);
  assert.deepEqual(await snapshotOfData(), sample);
  assert.ok((await store().get('profile')).rev > revBefore, 'restored documents get a new revision so open tabs see a conflict');
  assert.match(applied.json.snapshot, /^snapshots\/pre-restore-/);
  const snapDir = path.join(ctx.server.config.dataDir, applied.json.snapshot);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(snapDir, 'workspace', 'p2.json'), 'utf8')).data, { capstone: 'planner' });
});

test('preview summarizes merge and replace without changing anything', async () => {
  const backup = (await api(ctx, 'POST', '/api/backup/create')).json;
  await store().put('profile', { lang: 'en' }, { force: true }); // local change, newer than the backup
  await store().remove('progress/js-01');
  await store().put('bookmarks', { items: [] }, { force: true }); // local only
  const before = await snapshotOfData();
  const r = await api(ctx, 'POST', '/api/backup/preview', { backup, mode: 'replace' });
  assert.equal(r.json.ok, true);
  assert.deepEqual(r.json.problems, []);
  assert.deepEqual(r.json.summary, { mode: 'replace', total: 3, new: 1, replacing: 1, unchanged: 1, keptLocal: 0, localOnly: 1, removing: 1 });
  assert.deepEqual(r.json.summaries.merge, { mode: 'merge', total: 3, new: 1, replacing: 0, unchanged: 1, keptLocal: 1, localOnly: 1, removing: 0 });
  assert.deepEqual(await snapshotOfData(), before);

  const merged = await api(ctx, 'POST', '/api/backup/apply', { backup, mode: 'merge' });
  assert.equal(merged.status, 200);
  const after = await snapshotOfData();
  assert.deepEqual(after.profile, { lang: 'en' }, 'merge keeps the newer local copy');
  assert.deepEqual(after['progress/js-01'], sample['progress/js-01'], 'merge restores what is missing');
  assert.deepEqual(after.bookmarks, { items: [] }, 'merge keeps local-only documents');
});

test('a corrupted backup is rejected and the data stays untouched', async () => {
  const backup = (await api(ctx, 'POST', '/api/backup/create')).json;
  backup.docs[0].data = { tampered: true };
  const before = await snapshotOfData();
  const snapshots = async () => (await fs.readdir(path.join(ctx.server.config.dataDir, 'snapshots')).catch(() => [])).length;
  const snapshotsBefore = await snapshots();
  const preview = await api(ctx, 'POST', '/api/backup/preview', { backup });
  assert.equal(preview.json.ok, false);
  assert.deepEqual(preview.json.problems.map((p) => p.code), ['checksum-mismatch']);
  const applied = await api(ctx, 'POST', '/api/backup/apply', { backup, mode: 'replace' });
  assert.equal(applied.status, 422);
  assert.equal(applied.json.error, 'invalid-backup');
  assert.deepEqual(await snapshotOfData(), before);
  assert.equal(await snapshots(), snapshotsBefore, 'a rejected backup is refused before any snapshot or write');
});

test('newer schemas, newer formats, unsafe ids and non-backups are rejected', async () => {
  const good = (await api(ctx, 'POST', '/api/backup/create')).json;
  const cases = [
    [{ ...good, schemaVersion: 2 }, 'newer-schema'],
    [{ ...good, formatVersion: 2 }, 'newer-format'],
    [{ ...good, format: 'other' }, 'wrong-format'],
    [(() => { const docs = [...good.docs, { id: '../../meta', rev: 1, updatedAt: good.createdAt, data: {} }]; return { ...good, docs, checksum: checksumOf(docs) }; })(), 'bad-id'],
    [(() => { const docs = [...good.docs, good.docs[0]]; return { ...good, docs, checksum: checksumOf(docs) }; })(), 'duplicate-id'],
    ['not a backup', 'not-a-backup'],
  ];
  const before = await snapshotOfData();
  for (const [backup, code] of cases) {
    const preview = await api(ctx, 'POST', '/api/backup/preview', { backup });
    assert.ok(preview.json.problems.some((p) => p.code === code), `${code}: ${JSON.stringify(preview.json.problems)}`);
    const applied = await api(ctx, 'POST', '/api/backup/apply', { backup, mode: 'replace' });
    assert.equal(applied.status, 422, code);
  }
  assert.deepEqual(await snapshotOfData(), before);
});

test('a failure during apply puts the previous data back', async () => {
  const backup = (await api(ctx, 'POST', '/api/backup/create')).json;
  await reset({ profile: { lang: 'en' }, 'workspace/p9': { capstone: 'habits', files: { 'a.js': 'mine' } } });
  const before = await snapshotOfData();
  let writes = 0;
  await assert.rejects(
    applyBackup(store(), backup, 'replace', { onWrite: () => { writes += 1; if (writes === 2) throw Object.assign(new Error('disk unplugged'), { code: 'EIO' }); } }),
    (error) => error.status === 500 && error.code === 'restore-failed' && error.extra.restored === true,
  );
  assert.equal(writes, 2, 'the failure happened after documents were already overwritten');
  assert.deepEqual(await snapshotOfData(), before);
});

test('canonical JSON sorts keys at every level', () => {
  assert.equal(canonicalJson({ b: 1, a: { d: [3, { y: 1, x: 2 }], c: null } }), '{"a":{"c":null,"d":[3,{"x":2,"y":1}]},"b":1}');
  assert.equal(checksumOf([{ id: 'a', data: { y: 1, x: 2 } }]), checksumOf([{ data: { x: 2, y: 1 }, id: 'a' }]));
});
