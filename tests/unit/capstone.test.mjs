// Capstone project rules (shared/capstone.js), the export bundle (shared/project-export.js) and the
// capstone compiler's static checks (scripts/content/capstones.mjs). REQ-003, REQ-009–REQ-013, REQ-038.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { compileCapstones } from '../../scripts/content/capstones.mjs';
import { createMarkdown } from '../../scripts/content/lib.mjs';
import { pathProblem as serverPathProblem } from '../../server/api/lib/project-files.mjs';
import {
  START_BASE, changedPaths, coveredByBase, currentStep, filesProblem, isStepConfirmed, isStepDone, isStepNotPerformed, isStepSkipped, missingBefore, newFileProblem, nextOpenStep, passCounts, previousReferenceIndex, pathProblem, starterChanges, starterCovers, startingReference, stepNeedsDevice, unifiedDiff,
} from '../../shared/capstone.js';
import { MANIFEST_PATH, buildProjectExport, placeGenerated, relativeUrl, sha256Hex } from '../../shared/project-export.js';
import { api, rawRequest, startTestServer } from './helpers.mjs';

const sha = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
let tmp;
before(async () => { tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-capstone-unit-')); });
after(async () => { await fs.rm(tmp, { recursive: true, force: true }); });

test('project paths: the editor rejects everything the folder export rejects', () => {
  const samples = ['index.html', 'images/a.svg', '', '/abs.js', '../up.js', 'a/../b.js', 'a//b.js', 'a/', './a.js', 'con.txt', 'LPT1', 'x\\y.js', 'what?.js', 'a:b.js', 'name.', 'name ', '.git/config', 'a/.git/x', 'x'.repeat(241), 'ok/name-1_2.md'];
  for (const p of samples) if (serverPathProblem(p)) assert.ok(pathProblem(p), `${JSON.stringify(p)} is rejected by the export, so the editor must reject it too`);
  assert.equal(pathProblem('images/a.svg'), null);
  assert.equal(pathProblem('ok/name-1_2.md'), null);
  assert.equal(pathProblem('../up.js').code, 'dot-segment');
});

test('new file names: collisions, folders, reserved names and text-only extensions', () => {
  const existing = ['index.html', 'images/wish.svg'];
  assert.equal(newFileProblem('notes.md', existing), null);
  assert.equal(newFileProblem('.gitignore', existing), null);
  assert.equal(newFileProblem('index.html', existing).code, 'exists');
  assert.equal(newFileProblem('Index.HTML', existing).code, 'case-collision');
  assert.equal(newFileProblem('images', existing).code, 'folder-conflict');
  assert.equal(newFileProblem('index.html/x.js', existing).code, 'folder-conflict');
  assert.equal(newFileProblem('photo.png', existing).code, 'extension');
  assert.equal(newFileProblem('jsll-manifest.json', existing).code, 'reserved-name');
  assert.equal(newFileProblem('index.html', existing, { except: 'index.html' }), null, 'renaming a file to itself is fine');
  assert.equal(filesProblem({ 'a.js': '', 'A.js': '' }).code, 'case-collision');
  assert.equal(filesProblem({ a: '', 'a/b.js': '' }).code, 'folder-conflict');
});

const steps = [
  { unit: 'JS-01', mode: 'in-platform' },
  { unit: 'JS-02', mode: 'in-platform' },
  { unit: 'JS-15', mode: 'local' },
  { unit: 'JS-03', mode: 'in-platform' },
];

test('missing prior work and the starting reference of a step', () => {
  assert.deepEqual(missingBefore(steps, {}, 'JS-01'), []);
  assert.deepEqual(missingBefore(steps, {}, 'JS-03'), ['JS-01', 'JS-02'], 'local steps never block');
  assert.deepEqual(missingBefore(steps, { 'JS-01': { state: 'done', source: 'platform-check' }, 'JS-02': { state: 'skipped', source: 'starter' } }, 'JS-03'), []);
  assert.deepEqual(missingBefore(steps, { 'JS-01': { state: 'done', source: 'learner-confirmed' } }, 'JS-02'), ['JS-01'], 'only a platform check counts as done');
  assert.equal(startingReference(steps, 'JS-01'), null, 'CP-START');
  assert.equal(startingReference(steps, 'JS-03'), 'JS-02', 'the previous in-platform step');
  assert.equal(currentStep(steps, { 'JS-01': { state: 'done', source: 'platform-check' } }), 'JS-02');
});

test('local steps: confirmed by the learner or not performed, never "checked", and the next open step', () => {
  const confirmed = { state: 'done', source: 'learner-confirmed', confirmedAt: '2026-10-05T10:00:00.000Z' };
  const notPerformed = { state: 'skipped', source: 'no-native-tooling', skippedAt: '2026-10-05T10:00:00.000Z' };
  assert.equal(isStepConfirmed(confirmed), true);
  assert.equal(isStepDone(confirmed), false, 'a confirmation is not a platform check');
  assert.equal(isStepNotPerformed(notPerformed), true);
  assert.equal(isStepNotPerformed({ state: 'skipped', source: 'starter' }), false, 'a supplied reference is not "not performed"');
  assert.equal(isStepSkipped(notPerformed), true);
  assert.equal(stepNeedsDevice({ unit: 'RN-03', mode: 'local' }), true);
  assert.equal(stepNeedsDevice({ unit: 'NO-04', mode: 'local' }), false);
  assert.equal(stepNeedsDevice({ unit: 'JS-01', mode: 'in-platform' }), false);
  assert.equal(nextOpenStep(steps, {}), 'JS-01');
  const records = { 'JS-01': { state: 'done', source: 'platform-check' }, 'JS-02': { state: 'skipped', source: 'starter' } };
  assert.equal(nextOpenStep(steps, records), 'JS-15', 'a local step is a step to work on too');
  assert.equal(currentStep(steps, records), 'JS-03', 'the current in-platform step is unchanged');
  assert.equal(nextOpenStep(steps, { ...records, 'JS-15': confirmed }), 'JS-03');
  assert.equal(nextOpenStep(steps, { ...records, 'JS-15': confirmed, 'JS-03': { state: 'done', source: 'platform-check' } }), null);
});

test('a reference is compared with the previous reference of the same project, found by its entry file', () => {
  const refs = [{ entry: 'index.html' }, { entry: 'index.html' }, { entry: 'App.tsx' }, { entry: 'App.tsx' }, { entry: 'index.html' }];
  // CP-START, RE-12 (web), RN-01, RN-11 (native), NO-01 (the web project again).
  assert.deepEqual(refs.map((_, i) => previousReferenceIndex(refs, i)), [-1, 0, -1, 2, 1]);
});

test('a starter covers the undone steps up to its reference and never their real evidence', () => {
  const records = { 'JS-01': { state: 'done', source: 'platform-check' } };
  assert.deepEqual(starterCovers(steps, records, 'JS-02'), ['JS-02']);
  assert.deepEqual(starterCovers(steps, {}, 'JS-03'), ['JS-01', 'JS-02', 'JS-03']);
  assert.deepEqual(starterCovers(steps, {}, null), [], 'CP-START covers nothing');
});

test('a pass counts as the learner\'s own only for steps after the supplied base (REQ-038)', () => {
  const base = { kind: 'starter', unit: 'JS-02' };
  assert.equal(coveredByBase(steps, base, 'JS-01'), true);
  assert.equal(coveredByBase(steps, base, 'JS-02'), true);
  assert.equal(passCounts(steps, base, 'JS-02'), false);
  assert.equal(passCounts(steps, base, 'JS-03'), true);
  assert.equal(passCounts(steps, START_BASE, 'JS-01'), true);
});

test('starter changes overlay the reference and keep the learner\'s other files', () => {
  const { files, changes } = starterChanges({ 'index.html': 'mine', 'notes.md': 'my notes', 'app.js': 'same' }, { 'index.html': 'ref', 'app.js': 'same', 'styles.css': 'new' });
  assert.deepEqual(files, { 'index.html': 'ref', 'notes.md': 'my notes', 'app.js': 'same', 'styles.css': 'new' });
  assert.deepEqual(changes.map((c) => [c.path, c.kind]), [['index.html', 'modified'], ['styles.css', 'added'], ['notes.md', 'kept'], ['app.js', 'unchanged']]);
  assert.deepEqual(changedPaths({ a: '1', b: '2' }, { a: '1', b: '3', c: '4' }), { added: ['c'], removed: [], modified: ['b'] });
  const diff = unifiedDiff({ 'index.html': '<h1>A</h1>\n' }, { 'index.html': '<h1>B</h1>\n' }, { fromLabel: 'CP-START', toLabel: 'JS-01' });
  assert.match(diff, /--- CP-START\/index\.html\n\+\+\+ JS-01\/index\.html/);
  assert.match(diff, /-<h1>A<\/h1>\n\+<h1>B<\/h1>/);
});

const workspace = { id: 'wishlist-test', capstoneId: 'wishlist', lang: 'uk', files: { 'index.html': '<h1>Список бажань</h1>\n', 'app.js': 'console.log(1);\n' }, storage: { 'jsll.wishlist.v1': '{"records":[]}' }, steps: { 'JS-01': { state: 'done', source: 'platform-check' } } };

test('the export bundle: learner files unchanged, generated files, manifest with SHA-256 of every file', async () => {
  const bundle = await buildProjectExport({ workspace, title: 'Список бажань', contentVersion: 'abc', platformVersion: '0.1.0', now: new Date('2026-10-01T12:00:00Z') });
  assert.equal(bundle.name, 'js-learning-lab-wishlist');
  for (const [p, text] of Object.entries(workspace.files)) assert.equal(bundle.files[p], text);
  assert.deepEqual(Object.keys(bundle.files).sort(), ['README.md', 'app.js', 'data/exported-storage.json', 'index.html', 'package.json', 'serve.mjs', 'tools/restore-data.html']);
  assert.ok(!(MANIFEST_PATH in bundle.files));
  const m = bundle.manifest;
  assert.deepEqual([m.format, m.formatVersion, m.capstoneId, m.workspaceId, m.language, m.contentVersion, m.exportedAt], ['jsll-export', 1, 'wishlist', 'wishlist-test', 'uk', 'abc', '2026-10-01T12:00:00.000Z']);
  assert.deepEqual(m.files.map((f) => f.path), Object.keys(bundle.files).sort());
  for (const f of m.files) assert.equal(f.sha256, sha(bundle.files[f.path]));
  assert.equal(await sha256Hex('абв'), sha('абв'));
  assert.deepEqual(JSON.parse(bundle.files['data/exported-storage.json']).localStorage, workspace.storage);
  assert.equal(JSON.parse(bundle.files['package.json']).scripts.start, 'node serve.mjs');
  assert.match(bundle.files['README.md'], /^# Список бажань — js learning lab/);
  assert.match(bundle.files['README.md'], /npm start -- --port 4301/);
  // The platform's own minimum (package.json engines), not an older Node.js.
  assert.match(bundle.files['README.md'], /Node\.js 22\.13 або новіший/);
  assert.equal(JSON.parse(bundle.files['package.json']).engines.node, '>=22.13');
  assert.match(bundle.files['serve.mjs'], /Node\.js 22\.13 or newer/);
  const en = await buildProjectExport({ workspace: { ...workspace, lang: 'en' }, title: 'Wishlist', contentVersion: 'abc' });
  assert.match(en.files['README.md'], /Node\.js 22\.13 or newer/);
  assert.match(en.files['README.md'], /`Port 4300 is already in use`/);
  assert.doesNotMatch(bundle.files['README.md'] + en.files['README.md'], /Node\.js 18/);
  assert.match(bundle.files['tools/restore-data.html'], /const DATA_URL = "\.\.\/data\/exported-storage\.json"/);
});

test('generated files never overwrite learner files with the same name', async () => {
  const files = { 'index.html': 'x', 'README.md': 'my readme', data: 'a file called data' };
  const bundle = await buildProjectExport({ workspace: { ...workspace, files }, title: 'T', contentVersion: 'v' });
  assert.equal(bundle.files['README.md'], 'my readme');
  assert.ok(bundle.files['README.jsll.md'].includes('js learning lab'));
  assert.equal(bundle.files.data, 'a file called data');
  assert.ok('jsll-export/data/exported-storage.json' in bundle.files);
  assert.match(bundle.files['tools/restore-data.html'], /"\.\.\/jsll-export\/data\/exported-storage\.json"/);
  assert.deepEqual(bundle.manifest.renamedGenerated.map((r) => r.path), ['README.md', 'data/exported-storage.json']);
  assert.equal(placeGenerated('serve.mjs', new Set(['Serve.mjs'])), 'serve.jsll.mjs');
  assert.equal(relativeUrl('tools/restore-data.html', 'index.html'), '../index.html');
  await assert.rejects(buildProjectExport({ workspace: { ...workspace, files: { 'JSLL-MANIFEST.json': '{}' } }, title: 'T', contentVersion: 'v' }), /reserved/);
  await assert.rejects(buildProjectExport({ workspace: { ...workspace, files: { '../x.js': '' } }, title: 'T', contentVersion: 'v' }), /unsafe/);
});

test('the real folder endpoint accepts the bundle and writes the same hashes', async () => {
  const ctx = await startTestServer();
  try {
    const bundle = await buildProjectExport({ workspace, title: 'Список бажань', contentVersion: 'abc' });
    const { files: _files, format: _f, formatVersion: _v, exportedAt: _a, ...manifest } = bundle.manifest;
    const r = await api(ctx, 'POST', '/api/export/folder', { name: bundle.name, files: bundle.files, manifest });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const written = JSON.parse(await fs.readFile(path.join(r.json.path, MANIFEST_PATH), 'utf8'));
    assert.equal(written.capstoneId, 'wishlist');
    assert.deepEqual(written.files.map((f) => [f.path, f.sha256]), bundle.manifest.files.map((f) => [f.path, f.sha256]));
  } finally {
    await ctx.close();
  }
});

const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); }); });
function startServe(dir, args) {
  const child = spawn(process.execPath, ['serve.mjs', ...args], { cwd: dir });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  const exited = new Promise((resolve) => child.on('exit', (code) => resolve(code)));
  return { child, exited, output: () => out };
}

test('the generated serve.mjs serves only the project folder on loopback and explains port problems', async () => {
  const bundle = await buildProjectExport({ workspace, title: 'Список бажань', contentVersion: 'abc' });
  const dir = path.join(tmp, 'served');
  for (const [p, text] of Object.entries(bundle.files)) {
    await fs.mkdir(path.dirname(path.join(dir, p)), { recursive: true });
    await fs.writeFile(path.join(dir, p), text);
  }
  const port = await freePort();
  const run = startServe(dir, ['--port', String(port)]);
  try {
    for (let i = 0; i < 100 && !run.output().includes(`http://127.0.0.1:${port}/`); i += 1) await new Promise((r) => setTimeout(r, 50));
    assert.match(run.output(), /Проєкт працює: http:\/\/127\.0\.0\.1:\d+\//, 'messages follow the workspace language');
    const page = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(page.status, 200);
    assert.equal(await page.text(), workspace.files['index.html']);
    assert.equal((await fetch(`http://127.0.0.1:${port}/data/exported-storage.json`)).headers.get('content-type'), 'application/json; charset=utf-8');
    // DNS rebinding (security review #7): another site's name resolved to 127.0.0.1 gets nothing.
    const withHost = (host) => rawRequest(port, { path: '/data/exported-storage.json', headers: { host } });
    for (const host of [`evil.example:${port}`, `attacker.localhost:${port}`, `127.0.0.1:${port + 1}`]) {
      const res = await withHost(host);
      assert.equal(res.status, 421, host);
      assert.doesNotMatch(res.text, /jsll-storage/, host);
    }
    assert.equal((await withHost(`localhost:${port}`)).status, 200);
    // The browser's own favicon request gets an empty answer, not a 404 in the console.
    const favicon = await fetch(`http://127.0.0.1:${port}/favicon.ico`);
    assert.equal(favicon.status, 204);
    assert.equal((await fetch(`http://127.0.0.1:${port}/missing.png`)).status, 404, 'other missing files are still 404');
    // A second server on the same port explains how to choose another one.
    const busy = startServe(dir, ['--port', String(port)]);
    assert.equal(await busy.exited, 1);
    assert.match(busy.output(), new RegExp(`Порт ${port} уже зайнятий.*--port ${port + 1}`));
    // The README quotes the message serve.mjs prints in the same language.
    assert.match(bundle.files['README.md'], /`Порт 4300 уже зайнятий`/);
  } finally {
    run.child.kill();
    await run.exited;
  }
  const bad = startServe(dir, ['--port', '70000']);
  assert.equal(await bad.exited, 1);
  assert.match(bad.output(), /Неправильний порт «70000»/);
});

test('the compiler rejects incomplete capstone content with actionable messages', () => {
  const md = createMarkdown(new Map());
  const startFiles = { 'index.html': '<h1>%%startTitle%%</h1>' };
  const start = Object.fromEntries(['wishlist', 'planner', 'habits', 'expenses'].map((id) => [id, { dir: tmp, files: startFiles, strings: { startTitle: { uk: 'Мій проєкт', en: 'My project' } } }]));
  const step = {
    unit: 'JS-01',
    dir: tmp,
    order: 0,
    source: { unit: 'JS-01', mode: 'in-platform', title: { uk: 'Т', en: 'T' }, intro: { uk: 'І %%nope%%', en: 'I' }, purpose: { uk: 'П', en: 'P' }, objectives: [{ uk: 'О', en: 'O' }], transfer: { uk: 'Т', en: 'T' } },
    variants: {
      wishlist: {
        dir: tmp,
        task: { strings: { startTitle: { uk: 'Інше', en: 'Other' }, bad_key: { uk: 'x', en: 'x' } }, instructions: { uk: 'Напиши %%missing%%', en: 'Write' }, testTitles: { 'has title': { uk: 'Є', en: 'Has' } } },
        reference: { 'index.html': '<h1>%%startTitle%%</h1>' },
        tests: "test('has title', () => expect(L.projectTitle).toBeTruthy());\ntest('untitled', () => {});",
      },
    },
  };
  const { issues } = compileCapstones({ start, steps: [step] }, { md, domains: { capstones: {} }, syllabus: new Map() });
  const text = issues.map((i) => `${i.path}: ${i.message}`).join('\n');
  assert.match(text, /missing the planner\/ variant/);
  assert.match(text, /shared step text cannot use the capstone placeholder %%nope%%/);
  assert.match(text, /redefines an earlier key/);
  assert.match(text, /keys are camelCase/);
  assert.match(text, /placeholder %%missing%% is not defined/);
  assert.match(text, /tests\.js reads L\.projectTitle/);
  assert.match(text, /test "untitled" has no bilingual title/);
  // A local step's reference must hold its entry file: it tells which project the reference belongs to.
  const local = { ...step, unit: 'RN-01', source: { ...step.source, unit: 'RN-01', mode: 'local', entry: 'App.tsx', intro: { uk: 'І', en: 'I' } }, variants: { wishlist: { ...step.variants.wishlist, task: { instructions: { uk: 'Н', en: 'W' } }, tests: null } } };
  const localText = compileCapstones({ start, steps: [local] }, { md, domains: { capstones: {} }, syllabus: new Map() }).issues.map((i) => i.message).join('\n');
  assert.match(localText, /reference\/ has no entry file "App\.tsx"/);
});
