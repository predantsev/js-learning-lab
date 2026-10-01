// Project export to a VS Code folder (REQ-012, DEC-09): complete files + manifest with hashes,
// path safety, and earlier exports are never touched.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { exportFolder, safeName } from '../../server/api/export.mjs';
import { api, startTestServer } from './helpers.mjs';

let ctx;
before(async () => {
  ctx = await startTestServer();
});
after(async () => {
  await ctx?.close();
});

const files = {
  'package.json': '{ "name": "wishlist", "type": "module" }\n',
  'src/index.js': 'import { items } from "./items.js";\nconsole.log(items.length);\n',
  'src/items.js': 'export const items = ["лампа", "book"];\n',
  'README.md': '# Мій список бажань\n',
};

test('an export writes every file plus a manifest with SHA-256 hashes', async () => {
  const r = await api(ctx, 'POST', '/api/export/folder', { name: 'Wishlist', files, manifest: { capstone: 'wishlist', checkpoint: 'JS-10', contentVersion: 'test' } });
  assert.equal(r.status, 200);
  assert.equal(r.json.fileCount, 4);
  assert.ok(r.json.path.startsWith(ctx.server.config.exportsDir + path.sep));
  assert.match(r.json.folderName, /^Wishlist-\d{8}-\d{6}$/);
  for (const [p, text] of Object.entries(files)) assert.equal(await fs.readFile(path.join(r.json.path, p), 'utf8'), text);
  const manifest = JSON.parse(await fs.readFile(path.join(r.json.path, 'jsll-manifest.json'), 'utf8'));
  assert.equal(manifest.capstone, 'wishlist');
  assert.equal(manifest.format, 'jsll-export');
  assert.equal(manifest.formatVersion, 1);
  assert.deepEqual(manifest.files.map((f) => f.path), Object.keys(files).sort());
  for (const f of manifest.files) assert.equal(f.sha256, createHash('sha256').update(files[f.path], 'utf8').digest('hex'));
});

test('unsafe paths are rejected and nothing is written', async () => {
  const before = await fs.readdir(ctx.server.config.exportsDir).catch(() => []);
  const unsafe = [{ '../escape.js': '' }, { '/etc/passwd': '' }, { 'C:/x.js': '' }, { 'a\\b.js': '' }, { 'src/../../x': '' }, { 'x\u0000.js': '' }, { '.git/hooks/post-checkout': '' }, { 'Src/a.js': '', 'src/a.js': '' }, { a: '', 'a/b.js': '' }, { 'jsll-manifest.json': '{}' }, { 'con.txt': '' }];
  for (const f of unsafe) {
    const r = await api(ctx, 'POST', '/api/export/folder', { name: 'bad', files: f });
    assert.equal(r.status, 400, JSON.stringify(f));
  }
  assert.deepEqual(await fs.readdir(ctx.server.config.exportsDir).catch(() => []), before);
});

test('an export never overwrites an existing folder, including earlier exports edited locally', async () => {
  const exportsDir = path.join(ctx.tmp, 'exports-same-second');
  const now = new Date(2026, 9, 1, 12, 0, 0);
  const first = await exportFolder({ exportsDir, name: 'planner', files, manifest: {}, now });
  await fs.writeFile(path.join(first.path, 'src', 'index.js'), '// my local edits in VS Code\n');
  const second = await exportFolder({ exportsDir, name: 'planner', files, manifest: {}, now });
  assert.notEqual(second.path, first.path);
  assert.equal(path.basename(second.path), 'planner-20261001-120000-2');
  assert.equal(await fs.readFile(path.join(first.path, 'src', 'index.js'), 'utf8'), '// my local edits in VS Code\n');
});

test('folder names are safe and keep non-Latin letters', () => {
  assert.equal(safeName('Мій список бажань'), 'Мій-список-бажань');
  assert.equal(safeName('../../etc/passwd'), 'etc-passwd');
  assert.equal(safeName(''), 'project');
  assert.equal(safeName('NUL'), 'project');
  assert.equal(safeName('a'.repeat(100)).length, 60);
});
