// Learner document store (DEC-02, REQ-024, REQ-029): atomic writes, optimistic revisions,
// .bak recovery, fault injection and snapshot-protected migrations.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { DATA_SCHEMA_VERSION } from '../../server/config.mjs';
import { Store, StoreError } from '../../server/store.mjs';
import { api, startTestServer } from './helpers.mjs';

const dirs = [];
async function freshDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-store-'));
  dirs.push(dir);
  return dir;
}
after(async () => {
  for (const dir of dirs) await fs.rm(dir, { recursive: true, force: true });
});

test('writes are atomic: the envelope replaces the file and no temp files remain', async () => {
  const store = await new Store(await freshDir()).open();
  const a = await store.put('workspace/one', { files: { 'index.js': 'v1' } });
  const b = await store.put('workspace/one', { files: { 'index.js': 'v2' } }, { baseRev: a.rev });
  assert.equal(a.rev, 1);
  assert.equal(b.rev, 2);
  const file = path.join(store.docsDir, 'workspace', 'one.json');
  const envelope = JSON.parse(await fs.readFile(file, 'utf8'));
  assert.deepEqual(envelope.data, { files: { 'index.js': 'v2' } });
  assert.equal(envelope.schema, DATA_SCHEMA_VERSION);
  const leftovers = (await fs.readdir(path.dirname(file))).filter((f) => f.endsWith('.tmp'));
  assert.deepEqual(leftovers, []);
  assert.deepEqual(JSON.parse(await fs.readFile(`${file}.bak`, 'utf8')).data, { files: { 'index.js': 'v1' } });
});

test('learner data is private to this OS user: folders 0700, files 0600, an older meta.json is tightened', async (t) => {
  if (process.platform === 'win32') return t.skip('POSIX permissions');
  const mode = async (p) => (await fs.stat(p)).mode & 0o777;
  const root = await freshDir();
  const dataDir = path.join(root, 'data');
  const store = await new Store(dataDir).open();
  await store.put('workspace/one', { files: { 'index.js': 'v1' } });
  await store.put('workspace/one', { files: { 'index.js': 'v2' } }, { baseRev: 1 });
  assert.equal(await mode(dataDir), 0o700);
  assert.equal(await mode(store.docsDir), 0o700);
  assert.equal(await mode(path.join(store.docsDir, 'workspace')), 0o700);
  assert.equal(await mode(path.join(dataDir, 'meta.json')), 0o600, 'meta.json holds the API token');
  assert.equal(await mode(path.join(store.docsDir, 'workspace', 'one.json')), 0o600);
  assert.equal(await mode(path.join(store.docsDir, 'workspace', 'one.json.bak')), 0o600);
  // A data folder written by an earlier version (umask 022): the token file is tightened on open.
  await fs.chmod(path.join(dataDir, 'meta.json'), 0o644);
  await new Store(dataDir).open();
  assert.equal(await mode(path.join(dataDir, 'meta.json')), 0o600);
});

test('a stale revision is a conflict; force overwrites deliberately', async () => {
  const store = await new Store(await freshDir()).open();
  await store.put('progress', { step: 1 });
  await store.put('progress', { step: 2 }, { baseRev: 1 });
  await assert.rejects(store.put('progress', { step: 3 }, { baseRev: 1 }), (error) => error instanceof StoreError && error.code === 'conflict' && error.currentRev === 2);
  assert.deepEqual((await store.get('progress')).data, { step: 2 });
  const forced = await store.put('progress', { step: 9 }, { force: true });
  assert.equal(forced.rev, 3);
});

test('a damaged document is recovered from its .bak copy; without one it is reported as corrupt', async () => {
  const store = await new Store(await freshDir()).open();
  await store.put('notes', { text: 'first' });
  await store.put('notes', { text: 'second' }, { baseRev: 1 });
  const file = path.join(store.docsDir, 'notes.json');
  await fs.writeFile(file, '{"rev": 2, "data": {"te'); // torn write
  const recovered = await store.get('notes');
  assert.equal(recovered.recovered, true);
  assert.deepEqual(recovered.data, { text: 'first' });

  await store.put('lonely', { x: 1 });
  await fs.writeFile(path.join(store.docsDir, 'lonely.json'), 'not json');
  await assert.rejects(store.get('lonely'), (error) => error.code === 'corrupt');
});

test('injected write failures leave the previous version intact', async () => {
  const store = await new Store(await freshDir()).open();
  await store.put('settings', { theme: 'calm' });
  store.fault = 'write-fail';
  await assert.rejects(store.put('settings', { theme: 'dev' }, { baseRev: 1 }), (error) => error.code === 'write-failed');
  store.fault = 'disk-full';
  await assert.rejects(store.put('settings', { theme: 'dev' }, { baseRev: 1 }), (error) => error.code === 'disk-full');
  store.fault = null;
  assert.deepEqual((await store.get('settings')).data, { theme: 'calm' });
  assert.equal((await store.put('settings', { theme: 'dev' }, { baseRev: 1 })).rev, 2);
});

test('a failed migration restores the pre-migration snapshot and reports the error', async () => {
  const dir = await freshDir();
  await fs.mkdir(path.join(dir, 'docs'), { recursive: true });
  await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ schemaVersion: DATA_SCHEMA_VERSION - 1, token: 't'.repeat(48) }));
  const original = JSON.stringify({ rev: 4, updatedAt: '2026-01-01T00:00:00.000Z', data: { files: { 'a.js': 'keep me' } } });
  await fs.writeFile(path.join(dir, 'docs', 'workspace.json'), original);
  const migration = {
    to: DATA_SCHEMA_VERSION,
    async run(store) {
      await fs.writeFile(path.join(store.docsDir, 'workspace.json'), '{"half":'); // partial rewrite
      throw new Error('migration step exploded');
    },
  };
  const store = await new Store(dir, { migrations: [migration] }).open();
  assert.equal(store.state, 'migration-failed');
  assert.equal(store.migrationError, 'migration step exploded');
  assert.equal(await fs.readFile(path.join(dir, 'docs', 'workspace.json'), 'utf8'), original);
  const snapshots = await fs.readdir(path.join(dir, 'snapshots'));
  assert.equal(snapshots.length, 1);
  assert.match(snapshots[0], new RegExp(`^pre-migration-v${DATA_SCHEMA_VERSION - 1}-`));
  assert.equal(JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8')).schemaVersion, DATA_SCHEMA_VERSION - 1);
  await assert.rejects(store.put('workspace', {}, { force: true }), (error) => error.code === 'not-ready');
});

test('a successful migration records the new schema version', async () => {
  const dir = await freshDir();
  await fs.mkdir(path.join(dir, 'docs'), { recursive: true });
  await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ schemaVersion: DATA_SCHEMA_VERSION - 1, token: 't'.repeat(48) }));
  let ran = false;
  const store = await new Store(dir, { migrations: [{ to: DATA_SCHEMA_VERSION, run: async () => { ran = true; } }] }).open();
  assert.equal(ran, true);
  assert.equal(store.state, 'ready');
  assert.equal(JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8')).schemaVersion, DATA_SCHEMA_VERSION);
});

test('data from a newer schema is never written to', async () => {
  const dir = await freshDir();
  await fs.mkdir(path.join(dir, 'docs'), { recursive: true });
  await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ schemaVersion: DATA_SCHEMA_VERSION + 1, token: 't'.repeat(48) }));
  const store = await new Store(dir).open();
  assert.equal(store.state, 'newer-schema');
  await assert.rejects(store.put('x', {}), (error) => error.code === 'not-ready');
});

test('unsafe document ids are rejected', async () => {
  const store = await new Store(await freshDir()).open();
  for (const id of ['../escape', '/abs', 'a/../../b', 'UPPER', '', 'a//b']) await assert.rejects(store.put(id, {}), (error) => error.code === 'bad-id', id);
});

// ---- the same behavior through the HTTP API ----
let ctx;
before(async () => {
  ctx = await startTestServer({ testHooks: true });
});
after(async () => {
  await ctx?.close();
});

test('HTTP: revision conflicts answer 409 and injected disk-full answers 507', async () => {
  const first = await api(ctx, 'PUT', '/api/store/doc?id=profile', { data: { lang: 'uk' } });
  assert.equal(first.status, 200);
  const stale = await api(ctx, 'PUT', '/api/store/doc?id=profile', { data: { lang: 'en' }, baseRev: 0 });
  assert.equal(stale.status, 409);
  assert.equal(stale.json.currentRev, 1);
  assert.equal((await api(ctx, 'POST', '/api/__test/fault', { mode: 'disk-full' })).json.fault, 'disk-full');
  const full = await api(ctx, 'PUT', '/api/store/doc?id=profile', { data: { lang: 'en' }, baseRev: 1 });
  assert.equal(full.status, 507);
  await api(ctx, 'POST', '/api/__test/fault', { mode: null });
  const doc = await api(ctx, 'GET', '/api/store/doc?id=profile');
  assert.deepEqual(doc.json, { exists: true, rev: 1, updatedAt: first.json.updatedAt, recovered: false, data: { lang: 'uk' } });
  assert.equal((await api(ctx, 'GET', '/api/store/doc?id=..%2Fx')).status, 400);
});
