// Capstone project workspace in a real browser (V-02, V-05, V-06; REQ-003, REQ-009–REQ-013,
// REQ-024, REQ-033, REQ-038): CP-START workspaces for all four capstones, step checks with
// provenance, restart, starters with preview/snapshot/explicit choice, snapshot restore, capstone
// change, export (zip and folder contract) and the exported project running locally.
// Run: node --test tests/e2e/project.test.mjs   (needs `npm run build` first; uses installed Chrome)
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { strFromU8, unzipSync } from 'fflate';
import { chromium } from 'playwright-core';
import { buildContent } from '../../scripts/content/lib.mjs';
import { startServer } from '../../server/app.mjs';
import { ROOT } from '../../server/config.mjs';
import { MANIFEST_PATH, sha256Hex } from '../../shared/project-export.js';

const CAPSTONES = ['wishlist', 'planner', 'habits', 'expenses'];
const TITLES = { wishlist: 'Список бажань', planner: 'Планувальник', habits: 'Трекер звичок', expenses: 'Трекер витрат' };
const compiled = {};
let index;
let server;
let browser;
let context;
let page;
let dataDir;
let exportsDir;
const cleanups = [];

const localize = (text, strings, lang) => text.replace(/%%([a-zA-Z][a-zA-Z0-9_]*)%%/g, (m, k) => (strings[k] ? strings[k][lang] : m));
const startFiles = (id, lang) => Object.fromEntries(Object.entries(compiled[id].start.files).map(([p, t]) => [p, localize(t, compiled[id].start.strings, lang)]));
const referenceFiles = (id, lang, c = compiled[id], unit = 'JS-01') => {
  const step = c.steps.find((s) => s.unit === unit);
  return Object.fromEntries(Object.entries(step.reference).map(([p, t]) => [p, localize(t, step.strings, lang)]));
};

// ---------- page helpers ----------
async function storeDoc(p, id) {
  return p.evaluate(async (docId) => {
    const token = JSON.parse(document.getElementById('jsll-boot').textContent).token;
    const r = await fetch(`/api/store/doc?id=${encodeURIComponent(docId)}`, { headers: { 'x-jsll-token': token } });
    return r.json();
  }, id);
}
async function settled(p) {
  await p.waitForTimeout(80);
  await p.waitForFunction(() => document.querySelector('.save-indicator')?.classList.contains('save-saved'), null, { timeout: 15000 });
}
async function activeWorkspace(p) {
  await settled(p);
  const profile = await storeDoc(p, 'profile');
  const id = profile.data.activeWorkspaceId;
  return { id, ...(await storeDoc(p, `workspaces/${id}`)).data };
}
async function openProject(p, base, unit = 'JS-01') {
  await p.goto(`${base}#/project/${unit}`);
  await p.waitForSelector('.project-files .cm-content', { timeout: 15000 });
  await p.waitForSelector(`.project-step-detail[data-step="${unit}"]`);
}
async function editFile(p, file, text) {
  await p.locator(`.file-item[data-path="${file}"]`).click();
  await p.waitForSelector(`.code-editor[data-path="${file}"]`);
  await p.locator('.project-code .cm-content').fill(text);
}
async function runCount(p) {
  return Number(await p.locator('.project-result').getAttribute('data-run'));
}
async function checkStep(p) {
  const n = await runCount(p);
  await p.locator('.ws-actions .btn-check').click();
  await p.waitForFunction((prev) => {
    const r = document.querySelector('.project-result');
    return Number(r?.dataset.run) > prev && r.dataset.mode === 'test' && r.querySelector('.tests-summary');
  }, n, { timeout: 20000 });
  return {
    summary: (await p.locator('.project-result .tests-summary').textContent()).trim(),
    status: await p.locator('.project-step-detail .step-badge').getAttribute('data-status'),
    results: await p.locator('.project-result .test').evaluateAll((items) => items.map((li) => (li.classList.contains('test-pass') ? 'pass' : 'fail'))),
  };
}
async function runPreview(p) {
  const n = await runCount(p);
  await p.locator('.ws-actions .btn-primary').click();
  await p.waitForFunction((prev) => { const r = document.querySelector('.project-result'); return Number(r?.dataset.run) > prev && r.dataset.mode === 'run' && r.dataset.status === 'done'; }, n, { timeout: 20000 });
}
async function onboard(p, base, capstone) {
  await p.goto(base);
  await p.locator(`.capstone-card`, { hasText: compiled[capstone].title.uk }).click();
  await p.locator('.btn-large').click();
  await p.waitForURL(/#\/lesson\//);
}
async function switchProject(p, capstone) {
  const before = await activeWorkspace(p);
  await p.getByRole('button', { name: /Змінити проєкт|Change project/ }).click();
  await p.locator('dialog .capstone-card', { hasText: new RegExp(`${compiled[capstone].title.uk}|${compiled[capstone].title.en}`) }).click();
  await p.locator('dialog .btn-primary').click();
  await p.waitForFunction((t) => document.querySelector('.project-heading h1')?.textContent === t[0] || document.querySelector('.project-heading h1')?.textContent === t[1], [compiled[capstone].title.uk, compiled[capstone].title.en]);
  const ws = await activeWorkspace(p);
  assert.notEqual(ws.id, before.id, 'a new, separate workspace');
  return ws;
}
async function downloadFrom(p, click) {
  const [download] = await Promise.all([p.waitForEvent('download'), click()]);
  return { name: download.suggestedFilename(), bytes: await fs.readFile(await download.path()) };
}
const unzip = (bytes) => Object.fromEntries(Object.entries(unzipSync(new Uint8Array(bytes))).filter(([name]) => !name.endsWith('/')).map(([name, data]) => [name, strFromU8(data)]));
async function waitFor(fn, { timeout = 10000 } = {}) {
  const until = Date.now() + timeout;
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() > until) throw new Error('waitFor: the condition stayed false');
    await new Promise((r) => setTimeout(r, 100));
  }
}
const freePort = () => new Promise((resolve) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); }); });
const rawStatus = (port, rawPath) => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port, path: rawPath }, (res) => { res.resume(); resolve(res.statusCode); }).on('error', reject);
});

before(async () => {
  index = JSON.parse(await fs.readFile(path.join(ROOT, 'dist', 'content', 'index.json'), 'utf8'));
  for (const id of CAPSTONES) compiled[id] = JSON.parse(await fs.readFile(path.join(ROOT, 'dist', 'content', 'capstones', `${id}.json`), 'utf8'));
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-project-'));
  exportsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-project-exports-'));
  // The real POST /api/export/folder (server/api/export.mjs) writes into this temporary folder.
  server = await startServer({ port: 0, dataDir, exportsDir, quiet: true, testHooks: true });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  context = await browser.newContext({ viewport: { width: 1440, height: 960 }, acceptDownloads: true });
  page = await context.newPage();
});

after(async () => {
  for (const fn of cleanups.reverse()) await fn().catch(() => {});
  await browser?.close();
  await server?.close();
  await fs.rm(dataDir, { recursive: true, force: true });
  await fs.rm(exportsDir, { recursive: true, force: true });
});

test('the compiler writes the capstone-step lesson for JS-01 and it links to the project step', async () => {
  const unit = index.stages[0].units.find((u) => u.id === 'JS-01');
  const lesson = unit.lessons.find((l) => l.id === 'js-01-10-capstone-starter-page');
  assert.equal(lesson.authored, true);
  assert.equal(lesson.kind, 'capstone-step');
  const compiledLesson = JSON.parse(await fs.readFile(path.join(ROOT, 'dist', 'content', 'lessons', 'js-01-10-capstone-starter-page.json'), 'utf8'));
  assert.deepEqual(compiledLesson.blocks.map((b) => b.kind), ['explanation', 'transfer']);
  assert.equal(compiledLesson.blocks[1].capstoneStep, 'JS-01');
  assert.ok(compiledLesson.purpose.uk && compiledLesson.objectives.length > 0);
});

test('onboarding creates a workspace with the CP-START files in the interface language', async () => {
  await onboard(page, server.url, 'wishlist');
  await openProject(page, server.url);
  const ws = await activeWorkspace(page);
  assert.equal(ws.capstoneId, 'wishlist');
  assert.equal(ws.lang, 'uk');
  assert.deepEqual(ws.base.kind, 'start');
  assert.deepEqual(ws.files, startFiles('wishlist', 'uk'));
  assert.ok(!JSON.stringify(ws.files).includes('%%'), 'no placeholder left in the learner files');
  assert.deepEqual(await page.locator('.file-item').evaluateAll((els) => els.map((e) => e.dataset.path)), ['index.html', 'app.js', 'styles.css', 'images/wish.svg']);
  assert.match(await page.locator('.project-code .cm-content').innerText(), /<h1>Мій проєкт<\/h1>/);
});

test('the lesson page of the step links to the project; reading it does not complete it', async () => {
  await page.goto(`${server.url}#/lesson/js-01-10-capstone-starter-page/1`);
  await page.waitForSelector('.block-transfer');
  assert.equal(await page.locator('.block-transfer a.btn').getAttribute('href'), '#/project/JS-01');
  await page.locator('.block-transfer a.btn').click();
  await page.waitForSelector('.project-step-button[aria-current="step"][data-unit="JS-01"]');
  await settled(page);
  const progress = await storeDoc(page, 'progress');
  assert.notEqual(progress.data.lessons['js-01-10-capstone-starter-page']?.state, 'completed');
});

test('step JS-01 fails on the start state and passes after the reference edits typed in the editor (all four capstones)', async () => {
  for (const id of CAPSTONES) {
    let lang = 'uk';
    if (id !== 'wishlist') {
      // One project is created with an English interface: its files follow that language.
      if (id === 'habits') {
        await page.locator('.lang-option[lang="en"]').click();
        lang = 'en';
      }
      await switchProject(page, id);
    }
    await openProject(page, server.url);
    const first = await checkStep(page);
    assert.equal(first.status, 'pending', `${id}: start state is not a pass`);
    assert.ok(first.results.includes('fail'), `${id}: the start state fails at least one check`);
    await editFile(page, 'index.html', referenceFiles(id, lang)['index.html']);
    const second = await checkStep(page);
    assert.deepEqual([...new Set(second.results)], ['pass'], `${id}: every check passes (${second.summary})`);
    assert.equal(second.status, 'done', `${id}: recorded as checked by the platform`);
    const ws = await activeWorkspace(page);
    assert.equal(ws.lang, lang);
    assert.equal(ws.steps['JS-01'].state, 'done');
    assert.equal(ws.steps['JS-01'].source, 'platform-check');
    assert.equal(ws.steps['JS-01'].attempts, 2);
    assert.deepEqual(ws.files, { ...startFiles(id, lang), 'index.html': referenceFiles(id, lang)['index.html'] });
    if (lang === 'en') {
      await page.locator('.lang-option[lang="uk"]').click();
      const afterSwitch = await activeWorkspace(page);
      assert.deepEqual(afterSwitch.files, ws.files, 'a language switch never rewrites the project files');
      assert.match(await page.locator('.step-task').innerText(), /Заміни обидва на назву проєкту — Habit tracker/, 'Ukrainian instructions name the English text this project expects');
    }
  }
  // The capstone-step lesson follows the active project: its step is checked there.
  await settled(page);
  assert.equal((await storeDoc(page, 'progress')).data.lessons['js-01-10-capstone-starter-page'].state, 'completed');
});

test('restart keeps the files, the step state and the active project', async () => {
  const before = await activeWorkspace(page);
  await page.reload();
  await openProject(page, server.url);
  const afterReload = await activeWorkspace(page);
  assert.equal(afterReload.id, before.id);
  assert.deepEqual(afterReload.files, before.files);
  assert.equal(await page.locator('.project-step-detail .step-badge').getAttribute('data-status'), 'done');
  assert.match(await page.locator('.project-code .cm-content').innerText(), new RegExp(`<h1>${TITLES.expenses}</h1>`));
});

test('the project screen works in the three styles', async () => {
  const errors = [];
  const onError = (e) => errors.push(e.message);
  page.on('pageerror', onError);
  for (const [style, label] of [['editorial', 'Редакційний'], ['dev-workspace', 'Dev workspace'], ['calm-studio', 'Спокійна студія']]) {
    await page.goto(`${server.url}#/settings`);
    await page.getByRole('radio', { name: label }).click();
    await openProject(page, server.url);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.style), style);
    for (const selector of ['.project-files', '.project-step-detail', '.project-result', '.ws-actions .btn-check', '.snapshot-list, .project-card']) assert.equal(await page.locator(selector).first().isVisible(), true, `${style}: ${selector}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true, `${style}: no horizontal page overflow`);
  }
  page.off('pageerror', onError);
  assert.deepEqual(errors, []);
});

test('a missing project image is explained in the console', async () => {
  const ws = await activeWorkspace(page);
  await editFile(page, 'index.html', ws.files['index.html'].replace('images/expense.svg', 'images/expence.svg'));
  await runPreview(page);
  await page.locator('.project-result .result-tab', { hasText: 'Консоль' }).click();
  assert.match(await page.locator('.console-system').first().innerText(), /images\/expence\.svg не знайдено в проєкті/);
  await editFile(page, 'index.html', ws.files['index.html']);
});

test('unsafe paths are rejected; files are created, renamed and deleted with confirmation', async () => {
  // Keyboard only: the dialog takes focus, Enter submits.
  await page.getByRole('button', { name: 'Новий файл' }).focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('dialog[open] .path-input');
  assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('path-input')), true, 'focus moves into the dialog');
  await page.keyboard.type('keyboard.md');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.file-item[data-path="keyboard.md"]');
  await page.getByRole('button', { name: 'Видалити' }).focus();
  await page.keyboard.press('Enter');
  await page.locator('dialog .btn-danger').focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('.file-item[data-path="keyboard.md"]', { state: 'detached' });
  const tryCreate = async (name) => {
    await page.getByRole('button', { name: 'Новий файл' }).click();
    await page.locator('dialog .path-input').fill(name);
    await page.locator('dialog .btn-primary').click();
  };
  for (const [bad, message] of [['../evil.js', /«\.» і «\.\.»/], ['/abs.js', /не може починатися з \//], ['notes.exe', /лише текстові файли/], ['Index.html', /великими й малими/], ['index.html/x.js', /як тека або файл/], ['con.txt', /зарезервована/]]) {
    await tryCreate(bad);
    assert.match(await page.locator('dialog .form-error').innerText(), message, bad);
    await page.locator('dialog .btn', { hasText: 'Скасувати' }).click();
  }
  await tryCreate('notes.md');
  await page.waitForSelector('.file-item[data-path="notes.md"]');
  await page.getByRole('button', { name: 'Перейменувати' }).click();
  await page.locator('dialog .path-input').fill('docs/notes.md');
  await page.locator('dialog .btn-primary').click();
  await page.waitForSelector('.file-item[data-path="docs/notes.md"]');
  await page.getByRole('button', { name: 'Видалити' }).click();
  await page.waitForSelector('dialog[open] .btn-danger');
  await page.locator('dialog .btn', { hasText: 'Скасувати' }).click();
  assert.equal(await page.locator('.file-item[data-path="docs/notes.md"]').count(), 1, 'cancel keeps the file');
  await page.getByRole('button', { name: 'Видалити' }).click();
  await page.locator('dialog .btn-danger').click();
  await page.waitForSelector('.file-item[data-path="docs/notes.md"]', { state: 'detached' });
  await page.locator('.undo-delete').click();
  await page.waitForSelector('.file-item[data-path="docs/notes.md"]');
  await page.locator('.file-item[data-path="docs/notes.md"]').click();
  await page.getByRole('button', { name: 'Видалити' }).click();
  await page.locator('dialog .btn-danger').click();
  await page.waitForSelector('.file-item[data-path="docs/notes.md"]', { state: 'detached' });
  // The entry page cannot be removed or renamed.
  await page.locator('.file-item[data-path="index.html"]').click();
  assert.equal(await page.getByRole('button', { name: 'Видалити' }).isDisabled(), true);
});

test('skipping a step applies its reference only after a preview, a snapshot and an explicit choice — never as a pass', async () => {
  await switchProject(page, 'planner');
  await openProject(page, server.url);
  const before = await activeWorkspace(page);
  // Cancel first: nothing changes, no snapshot.
  await page.locator('.skip-step').click();
  await page.waitForSelector('dialog .starter-changes');
  assert.match(await page.locator('dialog .starter-change', { hasText: 'index.html' }).innerText(), /буде замінено/);
  assert.match(await page.locator('dialog .starter-covers').innerText(), /JS-01/);
  assert.ok((await page.locator('dialog .diff-add').count()) > 0, 'a per-file diff is shown');
  await page.locator('dialog .btn', { hasText: 'Скасувати' }).click();
  let ws = await activeWorkspace(page);
  assert.deepEqual(ws.files, before.files);
  assert.equal((ws.snapshots ?? []).length, 0);
  assert.equal((await storeDoc(page, `workspaces/${ws.id}/snap-1`)).exists, false);
  // Now apply it explicitly.
  await page.locator('.skip-step').click();
  await page.locator('dialog .btn-primary').click();
  await page.waitForSelector('dialog', { state: 'detached' });
  await page.locator('.banner', { hasText: 'Еталон застосовано' }).waitFor();
  ws = await activeWorkspace(page);
  assert.deepEqual(ws.files, referenceFiles('planner', 'uk'));
  assert.deepEqual({ state: ws.steps['JS-01'].state, source: ws.steps['JS-01'].source }, { state: 'skipped', source: 'starter' });
  assert.deepEqual({ kind: ws.base.kind, unit: ws.base.unit }, { kind: 'starter', unit: 'JS-01' });
  assert.equal(ws.snapshots.length, 1);
  const snap = await storeDoc(page, `workspaces/${ws.id}/snap-1`);
  assert.equal(snap.exists, true);
  assert.deepEqual(snap.data.files, before.files, 'the snapshot keeps the previous files');
  // The supplied files pass the checks, but the step is not counted as the learner's.
  const check = await checkStep(page);
  assert.deepEqual([...new Set(check.results)], ['pass']);
  assert.match(check.summary, /не зараховано/);
  assert.equal(check.status, 'skipped');
  ws = await activeWorkspace(page);
  assert.equal(ws.steps['JS-01'].state, 'skipped');
  assert.equal(ws.steps['JS-01'].lastCheck.counted, false);
  assert.equal((await storeDoc(page, 'progress')).data.lessons['js-01-10-capstone-starter-page'].state, 'skipped');
});

test('restoring a snapshot saves the current state first; own work after it counts again', async () => {
  await page.locator('.snapshot[data-snapshot="1"] button').click();
  await page.locator('dialog .btn-primary').click();
  await page.waitForSelector('.snapshot[data-snapshot="2"]');
  let ws = await activeWorkspace(page);
  assert.deepEqual(ws.files, startFiles('planner', 'uk'));
  assert.equal(ws.base.kind, 'start');
  assert.equal(ws.snapshots[1].reason, 'before-restore');
  const backup = await storeDoc(page, `workspaces/${ws.id}/snap-2`);
  assert.deepEqual(backup.data.files, referenceFiles('planner', 'uk'), 'the replaced state is recoverable');
  await openProject(page, server.url);
  await editFile(page, 'index.html', referenceFiles('planner', 'uk')['index.html']);
  const check = await checkStep(page);
  assert.equal(check.status, 'done-assisted', 'checked by the platform, marked as assisted');
  ws = await activeWorkspace(page);
  assert.equal(ws.steps['JS-01'].state, 'done');
  assert.equal(ws.steps['JS-01'].source, 'platform-check');
  assert.equal(ws.steps['JS-01'].assisted, true, 'the reference was previewed before: the pass is marked assisted');
  // A snapshot can also be created by hand, with an optional label.
  await page.getByRole('button', { name: 'Створити знімок' }).click();
  await page.locator('dialog .path-input').fill('мій знімок');
  await page.locator('dialog .btn-primary').click();
  await page.waitForSelector('.snapshot[data-snapshot="3"]');
  assert.match(await page.locator('.snapshot[data-snapshot="3"]').innerText(), /створено вручну · «мій знімок»/);
  ws = await activeWorkspace(page);
  const manual = await storeDoc(page, `workspaces/${ws.id}/snap-3`);
  assert.deepEqual([manual.data.reason, manual.data.label], ['manual', 'мій знімок']);
  assert.deepEqual(manual.data.files, ws.files);
});

test('changing the capstone keeps the old workspace intact and starts the new one unpassed', async () => {
  // General lesson progress: open a lesson so it has a state, then change the project.
  await page.goto(`${server.url}#/lesson/js-01-01-code-runs/1`);
  await page.waitForSelector('.lesson');
  await settled(page);
  const progressBefore = (await storeDoc(page, 'progress')).data.lessons['js-01-01-code-runs'];
  await openProject(page, server.url);
  const old = await activeWorkspace(page);
  const fresh = await switchProject(page, 'wishlist');
  assert.equal(fresh.steps['JS-01'], undefined, 'the new project starts unpassed');
  assert.deepEqual(fresh.files, startFiles('wishlist', 'uk'));
  await settled(page);
  const progress = (await storeDoc(page, 'progress')).data.lessons;
  assert.deepEqual(progress['js-01-01-code-runs'], progressBefore, 'general lesson progress is untouched');
  assert.notEqual(progress['js-01-10-capstone-starter-page'].state, 'completed', 'the step lesson follows the new project');
  const items = (await storeDoc(page, 'workspaces')).data.items;
  assert.ok(items.some((w) => w.id === old.id) && items.length >= 6, 'old projects stay listed');
  // Re-activate the old project: its files and step state are intact.
  await openProject(page, server.url);
  await page.locator(`.workspace-item[data-workspace="${old.id}"] button`).click();
  await page.waitForFunction((t) => document.querySelector('.project-heading h1')?.textContent === t, TITLES.planner);
  const back = await activeWorkspace(page);
  assert.equal(back.id, old.id);
  assert.deepEqual(back.files, old.files);
  assert.equal(back.steps['JS-01'].state, 'done');
  await settled(page);
  assert.equal((await storeDoc(page, 'progress')).data.lessons['js-01-10-capstone-starter-page'].state, 'completed');
});

let exportedZip;
const APP_JS = `// The project script. It counts visits in the browser storage and shows the count.
const saved = localStorage.getItem("jsll-e2e-visits");
const visits = Number(saved ?? 0) + 1;
localStorage.setItem("jsll-e2e-visits", String(visits));
const line = document.createElement("p");
line.id = "visits";
line.textContent = "visits: " + visits;
document.querySelector("main").append(line);
console.log("visits", visits);
`;

test('export: the zip has every current file (including unsaved typed edits) and matching manifest hashes', async () => {
  await openProject(page, server.url);
  // Saving fails from now on: the typed edit exists only in the browser.
  await page.evaluate(async () => {
    const token = JSON.parse(document.getElementById('jsll-boot').textContent).token;
    await fetch('/api/__test/fault', { method: 'POST', headers: { 'x-jsll-token': token, 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'write-fail' }) });
  });
  await editFile(page, 'app.js', APP_JS);
  await page.waitForSelector('.save-indicator.save-failed', { timeout: 15000 });
  await runPreview(page);
  await runPreview(page);
  await page.locator('.project-result .result-tab', { hasText: 'Сховище' }).click();
  assert.equal(await page.locator('.storage-table tr', { hasText: 'jsll-e2e-visits' }).locator('td').innerText(), '2');
  await page.getByRole('button', { name: 'Експортувати проєкт' }).click();
  assert.match(await page.locator('dialog').innerText(), /незбережені зміни/);
  const zip = await downloadFrom(page, () => page.locator('dialog .btn-primary').click());
  assert.match(zip.name, /^js-learning-lab-planner-\d{4}-\d{2}-\d{2}\.zip$/);
  await page.waitForSelector('dialog .export-ok');
  await page.locator('dialog .btn', { hasText: 'Закрити' }).click();
  const files = unzip(zip.bytes);
  const root = 'js-learning-lab-planner/';
  assert.ok(Object.keys(files).every((p) => p.startsWith(root)), 'one top-level folder');
  const tree = Object.fromEntries(Object.entries(files).map(([p, t]) => [p.slice(root.length), t]));
  assert.equal(tree['app.js'], APP_JS, 'the unsaved typed edit is exported');
  // Saving works again; the platform still has the same files.
  await page.evaluate(async () => {
    const token = JSON.parse(document.getElementById('jsll-boot').textContent).token;
    await fetch('/api/__test/fault', { method: 'POST', headers: { 'x-jsll-token': token, 'content-type': 'application/json' }, body: JSON.stringify({ mode: null }) });
  });
  // The failed saves retry by themselves; the banner button only makes it immediate.
  const retry = page.getByRole('button', { name: 'Спробувати ще раз' });
  if (await retry.isVisible()) await retry.click();
  const ws = await activeWorkspace(page);
  for (const [p, text] of Object.entries(ws.files)) assert.equal(tree[p], text, `learner file ${p}`);
  for (const p of ['README.md', 'package.json', 'serve.mjs', 'data/exported-storage.json', 'tools/restore-data.html', MANIFEST_PATH]) assert.ok(p in tree, `${p} is exported`);
  const manifest = JSON.parse(tree[MANIFEST_PATH]);
  assert.equal(manifest.format, 'jsll-export');
  assert.equal(manifest.formatVersion, 1);
  assert.equal(manifest.capstoneId, 'planner');
  assert.equal(manifest.workspaceId, ws.id);
  assert.equal(manifest.language, 'uk');
  assert.equal(manifest.contentVersion, index.contentVersion);
  assert.ok(!Number.isNaN(Date.parse(manifest.exportedAt)));
  assert.deepEqual(manifest.files.map((f) => f.path).sort(), Object.keys(tree).filter((p) => p !== MANIFEST_PATH).sort());
  for (const entry of manifest.files) {
    assert.equal(entry.sha256, await sha256Hex(tree[entry.path]), `sha256 of ${entry.path}`);
    assert.equal(entry.bytes, Buffer.byteLength(tree[entry.path]), `bytes of ${entry.path}`);
  }
  assert.deepEqual(JSON.parse(tree['data/exported-storage.json']).localStorage, { 'jsll-e2e-visits': '2' });
  assert.equal(JSON.parse(tree['package.json']).scripts.start, 'node serve.mjs');
  assert.match(tree['README.md'], /npm start/);
  assert.match(tree['README.md'], /http:\/\/127\.0\.0\.1:4300\//);
  assert.ok(ws.exportedAt, 'the workspace records the export');
  exportedZip = tree;
});

test('the exported project runs locally with npm start and restores the saved data', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-exported-'));
  cleanups.push(() => fs.rm(dir, { recursive: true, force: true }));
  for (const [p, text] of Object.entries(exportedZip)) {
    await fs.mkdir(path.dirname(path.join(dir, p)), { recursive: true });
    await fs.writeFile(path.join(dir, p), text);
  }
  const port = await freePort();
  const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['start', '--', '--port', String(port)], { cwd: dir, detached: true, env: { ...process.env, PORT: '' } });
  cleanups.push(async () => { try { process.kill(-child.pid, 'SIGTERM'); } catch { /* gone */ } });
  const origin = `http://127.0.0.1:${port}`;
  await new Promise((resolve, reject) => {
    let out = '';
    const timer = setTimeout(() => reject(new Error(`no start message: ${out}`)), 20000);
    child.stdout.on('data', (d) => { out += d; if (out.includes(`${origin}/`)) { clearTimeout(timer); resolve(); } });
    child.stderr.on('data', (d) => { out += d; });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`npm start exited with ${code}: ${out}`)); });
  });
  const local = await browser.newContext();
  cleanups.push(() => local.close());
  const p = await local.newPage();
  const logs = [];
  p.on('console', (m) => logs.push(m.text()));
  // The restore page writes the dataset into this origin's localStorage, on an explicit click.
  await p.goto(`${origin}/tools/restore-data.html`);
  await p.waitForSelector('table');
  assert.match(await p.locator('tbody tr').innerText(), /jsll-e2e-visits[\s\S]*2[\s\S]*буде додано/);
  assert.equal(await p.evaluate(() => localStorage.getItem('jsll-e2e-visits')), null, 'nothing is written before the click');
  await p.getByRole('button', { name: 'Відновити дані' }).click();
  assert.match(await p.locator('#status').innerText(), /записано 1/);
  await p.goto(`${origin}/`);
  await p.waitForSelector('#visits');
  assert.equal(await p.locator('main h1').innerText(), TITLES.planner);
  assert.equal(await p.locator('#visits').innerText(), 'visits: 3', 'the platform count (2) continues locally');
  assert.equal(await p.evaluate(() => { const img = document.querySelector('main img'); return img.complete && img.naturalWidth > 0; }), true, 'the project image is served');
  assert.ok(logs.includes('visits 3'));
  // Only this folder is served (raw paths, not normalized by a URL parser), and no hidden files.
  assert.equal(await rawStatus(port, '/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fhosts'), 404);
  assert.equal(await rawStatus(port, '/..%2f..%2fetc%2fpasswd'), 404);
  await fs.mkdir(path.join(dir, '.git'), { recursive: true });
  await fs.writeFile(path.join(dir, '.git', 'config'), '[core]\n');
  assert.equal(await rawStatus(port, '/.git/config'), 404);
  assert.equal(await rawStatus(port, '/serve.mjs'), 200);
});

test('folder export writes a new folder through POST /api/export/folder', async () => {
  await openProject(page, server.url);
  await page.getByRole('button', { name: 'Експортувати проєкт' }).click();
  await page.locator('dialog .btn', { hasText: 'Зберегти в теку' }).click();
  await page.waitForSelector('dialog .export-ok');
  assert.match(await page.locator('dialog .export-ok').innerText(), new RegExp(exportsDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await page.locator('dialog .btn', { hasText: 'Закрити' }).click();
  const ws = await activeWorkspace(page);
  assert.deepEqual(ws.exports.map((e) => e.kind), ['zip', 'folder']);
  const folder = ws.exports[1].path;
  assert.ok(folder.startsWith(exportsDir) && /js-learning-lab-planner-\d{8}-\d{6}$/.test(folder), folder);
  for (const [p, text] of Object.entries(ws.files)) assert.equal(await fs.readFile(path.join(folder, p), 'utf8'), text, `learner file ${p}`);
  const manifest = JSON.parse(await fs.readFile(path.join(folder, MANIFEST_PATH), 'utf8'));
  assert.equal(manifest.format, 'jsll-export');
  assert.equal(manifest.capstoneId, 'planner');
  assert.equal(manifest.workspaceId, ws.id);
  assert.equal(manifest.language, 'uk');
  assert.equal(manifest.contentVersion, index.contentVersion);
  for (const entry of manifest.files) assert.equal(entry.sha256, await sha256Hex(await fs.readFile(path.join(folder, entry.path), 'utf8')), `sha256 of ${entry.path}`);
  for (const p of ['README.md', 'package.json', 'serve.mjs', 'data/exported-storage.json', 'tools/restore-data.html']) assert.ok(manifest.files.some((f) => f.path === p), `${p} is exported`);
});

test('after export the project explains local authority and offers reference downloads and diffs', async () => {
  await openProject(page, server.url);
  const panel = page.locator('.after-export');
  assert.match(await panel.innerText(), /головні — файли у VS Code/);
  assert.match(await panel.innerText(), /ніколи їх не перезаписує/);
  const ref = await downloadFrom(page, () => panel.locator('.reference-list button', { hasText: 'JS-01' }).click());
  const files = unzip(ref.bytes);
  const root = 'js-learning-lab-planner-reference-js-01/';
  const tree = Object.fromEntries(Object.entries(files).map(([p, t]) => [p.slice(root.length), t]));
  for (const [p, text] of Object.entries(referenceFiles('planner', 'uk'))) assert.equal(tree[p], text, `reference file ${p}`);
  const manifest = JSON.parse(tree['jsll-reference.json']);
  assert.equal(manifest.reference, 'JS-01');
  assert.equal(manifest.previous, 'CP-START');
  for (const entry of manifest.files) assert.equal(entry.sha256, await sha256Hex(tree[entry.path]));
  assert.match(tree['JSLL-REFERENCE.md'], /```diff[\s\S]*\+.*Планувальник/);
  await panel.locator('.diff-pairs .segment', { hasText: 'CP-START → JS-01' }).click();
  assert.match(await panel.locator('.reference-diff', { hasText: 'index.html' }).innerText(), /index\.html/);
  assert.ok((await panel.locator('.reference-diff .diff-add').count()) > 0);
});

/**
 * A temporary build whose capstones have CP-START, the real JS-01 step and a synthetic JS-02 step
 * (a footer) in place of every later real step. Only CP-START and JS-01 are copied from
 * content/capstones, so the synthetic step never collides with the real JS-02 (its tests, strings
 * and references) or with steps after it, whatever they contain. Built once, shared by the tests.
 */
let syntheticBuild = null;
function syntheticSteps() {
  syntheticBuild ??= (async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-project-synthetic-'));
    cleanups.push(() => fs.rm(tmp, { recursive: true, force: true }));
    const caps = path.join(tmp, 'capstones');
    await fs.cp(path.join(ROOT, 'content', 'capstones', 'start'), path.join(caps, 'start'), { recursive: true });
    await fs.cp(path.join(ROOT, 'content', 'capstones', 'steps', 'JS-01'), path.join(caps, 'steps', 'JS-01'), { recursive: true });
    const stepDir = path.join(caps, 'steps', 'JS-02');
    await fs.mkdir(stepDir, { recursive: true });
    const both = (text) => `{ uk: "${text}", en: "${text}" }`;
    await fs.writeFile(path.join(stepDir, 'step.yaml'), [
      'unit: JS-02', 'mode: in-platform', 'entry: index.html',
      `title: ${both('Synthetic test step')}`, `intro: ${both('A synthetic step used only by tests/e2e/project.test.mjs.')}`,
      `purpose: ${both('Test fixture.')}`, `objectives: [${both('Add a footer.')}]`, `transfer: ${both('Open the step in the project.')}`, '',
    ].join('\n'));
    await fs.writeFile(path.join(stepDir, 'tests.js'), "test('page has a footer', () => { expect(screen.$('footer'), 'a <footer> element').toBeTruthy(); });\n");
    for (const id of CAPSTONES) {
      const v = path.join(stepDir, id);
      await fs.cp(path.join(caps, 'steps', 'JS-01', id, 'reference'), path.join(v, 'reference'), { recursive: true });
      const html = await fs.readFile(path.join(v, 'reference', 'index.html'), 'utf8');
      await fs.writeFile(path.join(v, 'reference', 'index.html'), html.replace('</main>', '</main>\n  <footer><p>%%footerText%%</p></footer>'));
      await fs.writeFile(path.join(v, 'task.yaml'), [
        'strings:', `  footerText: ${both('Synthetic footer')}`,
        `instructions: ${both('Add a footer after main.')}`,
        'testTitles:', `  "page has a footer": ${both('The page has a footer')}`,
        'feedback:', '  - when: { error: ReferenceError }',
        '    message: { uk: "Синтетичний відгук про ReferenceError: %%footerText%%", en: "Synthetic ReferenceError feedback: %%footerText%%" }', '',
      ].join('\n'));
    }
    const dist = path.join(tmp, 'dist');
    await fs.mkdir(dist);
    await fs.symlink(path.join(ROOT, 'dist', 'app'), path.join(dist, 'app'));
    await fs.symlink(path.join(ROOT, 'dist', 'sandbox'), path.join(dist, 'sandbox'));
    const build = await buildContent({ outDir: path.join(dist, 'content'), quiet: true, capstonesDir: caps });
    const wishlist = JSON.parse(await fs.readFile(path.join(dist, 'content', 'capstones', 'wishlist.json'), 'utf8'));
    return { dist, issues: build.issues, wishlist };
  })();
  return syntheticBuild;
}

test('opening a later step with missing earlier work offers the reference before it (synthetic second step)', async () => {
  const { dist, issues, wishlist: synthetic } = await syntheticSteps();
  assert.deepEqual(issues, [], 'the synthetic content compiles cleanly');
  assert.deepEqual(synthetic.steps.map((s) => s.unit), ['JS-01', 'JS-02'], 'the real JS-01 and the synthetic JS-02, nothing else');
  const data2 = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-project-data2-'));
  cleanups.push(() => fs.rm(data2, { recursive: true, force: true }));
  const server2 = await startServer({ port: 0, dataDir: data2, distDir: dist, quiet: true });
  cleanups.push(() => server2.close());
  // This installation does not offer folder export: the export dialog must degrade to the zip.
  delete server2.api.features.exportFolder;
  delete server2.api.features.export;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  cleanups.push(() => ctx.close());
  const p = await ctx.newPage();
  await onboard(p, server2.url, 'wishlist');
  await openProject(p, server2.url, 'JS-02');
  const start = await activeWorkspace(p);
  // The learner first continues with their own files…
  assert.match(await p.locator('.starter-offer').innerText(), /JS-01/);
  await p.getByRole('button', { name: 'Продовжити зі своїми файлами' }).click();
  await p.waitForSelector('.starter-declined');
  await p.getByRole('button', { name: 'Показати пропозицію ще раз' }).click();
  // …then previews the reference before JS-02 and applies it explicitly.
  await p.getByRole('button', { name: /Переглянути еталон перед кроком/ }).click();
  await p.waitForSelector('dialog .starter-changes');
  assert.match(await p.locator('dialog').innerText(), /стан після кроку JS-01/);
  assert.match(await p.locator('dialog .starter-covers').innerText(), /JS-01/);
  await p.locator('dialog .btn-primary').click();
  await p.waitForSelector('dialog', { state: 'detached' });
  let ws = await activeWorkspace(p);
  assert.deepEqual(ws.files, referenceFiles('wishlist', 'uk', synthetic));
  assert.deepEqual({ state: ws.steps['JS-01'].state, source: ws.steps['JS-01'].source }, { state: 'skipped', source: 'starter' });
  assert.equal((await storeDoc(p, `workspaces/${ws.id}/snap-1`)).data.files['index.html'], start.files['index.html']);
  assert.equal(await p.locator('.project-step-button[data-unit="JS-01"]').getAttribute('class').then((c) => c.includes('step-skipped')), true);
  // JS-02 starts from the supplied state; the learner's own work on it counts.
  const failing = await checkStep(p);
  assert.equal(failing.status, 'pending');
  await editFile(p, 'index.html', ws.files['index.html'].replace('</main>', '</main>\n  <footer><p>Мій підвал</p></footer>'));
  const passing = await checkStep(p);
  assert.equal(passing.status, 'done');
  ws = await activeWorkspace(p);
  assert.equal(ws.steps['JS-02'].source, 'platform-check');
  assert.equal(ws.steps['JS-01'].state, 'skipped', 'the supplied step stays supplied');
  const lessons = (await storeDoc(p, 'progress')).data.lessons;
  assert.equal(lessons['js-01-10-capstone-starter-page'].state, 'skipped');
  // Without the folder-export feature only the zip is offered, with an explanation.
  await p.getByRole('button', { name: 'Експортувати проєкт' }).click();
  await p.waitForSelector('dialog .export-actions');
  assert.equal(await p.locator('dialog .btn', { hasText: 'Зберегти в теку' }).count(), 0);
  assert.match(await p.locator('dialog .export-actions').innerText(), /Збереження в теку недоступне в цій установці/);
  assert.equal(await p.locator('dialog .btn-primary', { hasText: 'Завантажити .zip' }).count(), 1);
});

test('the project screen shows the authored feedback of the step for an error, in the console and with the checks', async () => {
  const { dist, issues } = await syntheticSteps();
  assert.deepEqual(issues, [], 'the synthetic content compiles cleanly');
  const data3 = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-project-data3-'));
  cleanups.push(() => fs.rm(data3, { recursive: true, force: true }));
  const server3 = await startServer({ port: 0, dataDir: data3, distDir: dist, quiet: true });
  cleanups.push(() => server3.close());
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  cleanups.push(() => ctx.close());
  const p = await ctx.newPage();
  await onboard(p, server3.url, 'wishlist');
  await openProject(p, server3.url, 'JS-02');
  await p.getByRole('button', { name: 'Продовжити зі своїми файлами' }).click();
  await p.waitForSelector('.starter-declined');
  // The step's rule `when: { error: ReferenceError }`, with %%footerText%% in the project language.
  const feedback = 'Синтетичний відгук про ReferenceError: Synthetic footer';
  await editFile(p, 'app.js', 'console.log("before");\nshowFooter();\n');
  // Check: the program fails while loading; its error card carries the feedback, once.
  const check = await checkStep(p);
  assert.equal(check.status, 'pending');
  const checkCard = p.locator('.project-result .error-card');
  assert.equal(await checkCard.count(), 1);
  assert.match(await checkCard.innerText(), /ReferenceError: showFooter is not defined/);
  assert.equal((await checkCard.locator('.test-feedback').innerText()).trim(), feedback);
  assert.equal(await p.locator('.project-result .ws-load-error').count(), 1, 'the load error is named as the reason the checks failed');
  assert.equal(await p.locator('.project-result .test-list .test-feedback').count(), 0, 'no per-check feedback for a program that did not load');
  // Run: the console shows the same error card with the feedback.
  await runPreview(p);
  await p.locator('.project-result .result-tab', { hasText: 'Консоль' }).click();
  const runCard = p.locator('.project-result .console-wrap .error-card');
  assert.equal(await runCard.count(), 1);
  assert.equal((await runCard.locator('.test-feedback').innerText()).trim(), feedback);
  // In English the feedback follows the interface language.
  await p.locator('.lang-option[lang="en"]').click();
  await p.locator('.project-result .console-wrap .error-card .test-feedback', { hasText: 'Synthetic ReferenceError feedback: Synthetic footer' }).waitFor();
});

test('local steps are listed by stage with their task; the learner confirms them, or marks a native one not performed', async () => {
  const ws = await activeWorkspace(page);
  const capstone = compiled[ws.capstoneId];
  await page.goto(`${server.url}#/project/RN-03`);
  const detail = page.locator('.project-step-detail[data-step="RN-03"]');
  await detail.waitFor();
  // Every published step of every stage is listed, in four stage groups.
  assert.deepEqual(await page.locator('.project-stage').evaluateAll((els) => els.map((e) => e.dataset.stage)), ['JS', 'RE', 'RN', 'NO']);
  assert.equal(await page.locator('.project-step-button').count(), capstone.steps.length);
  // The task of a local step is shown, not "planned, not published".
  const step = capstone.steps.find((s) => s.unit === 'RN-03');
  assert.equal(await detail.locator('#project-step-title').innerText(), step.title.uk);
  assert.doesNotMatch(await detail.innerText(), /ще не опубліковано/);
  assert.ok((await detail.locator('.step-task .prose').innerText()).length > 200, 'the instructions are shown');
  assert.equal(await page.locator('.ws-actions .btn-check').count(), 0, 'a local step has no platform check');
  // Native step without an emulator or device: not performed, never done; the lesson shows as skipped.
  await detail.getByRole('button', { name: 'У мене немає емулятора чи пристрою' }).click();
  assert.equal(await detail.locator('.step-badge').getAttribute('data-status'), 'not-performed');
  await settled(page);
  let doc = await activeWorkspace(page);
  assert.equal(doc.steps['RN-03'].state, 'skipped');
  assert.equal(doc.steps['RN-03'].source, 'no-native-tooling');
  let lesson = await waitFor(async () => { const l = (await storeDoc(page, 'progress')).data.lessons['rn-03-08-capstone-native-crud']; return l?.project?.state === 'not-performed' ? l : null; });
  assert.equal(lesson.state, 'skipped');
  // Revisitable: back to the task.
  await detail.getByRole('button', { name: 'Повернутися до завдання' }).click();
  assert.equal(await detail.locator('.step-badge').getAttribute('data-status'), 'pending');
  await settled(page);
  assert.equal((await activeWorkspace(page)).steps['RN-03'].state, 'pending');
  lesson = await waitFor(async () => { const l = (await storeDoc(page, 'progress')).data.lessons['rn-03-08-capstone-native-crud']; return l?.project?.state === 'pending' ? l : null; });
  assert.equal(lesson.state, 'in-progress');
  // A Node.js step is confirmed by the learner (no device question); its lesson completes.
  // Only the stage of the selected step is open: the learner opens the Node.js group first.
  assert.equal(await page.locator('.project-stage[data-stage="NO"]').getAttribute('open'), null);
  await page.locator('.project-stage[data-stage="NO"] > summary').click();
  await page.locator('.project-step-button[data-unit="NO-04"]').click();
  const no04 = page.locator('.project-step-detail[data-step="NO-04"]');
  await no04.waitFor();
  assert.equal(await no04.getByRole('button', { name: 'У мене немає емулятора чи пристрою' }).count(), 0);
  await no04.getByRole('button', { name: 'Цей крок виконано' }).click();
  assert.equal(await no04.locator('.step-badge').getAttribute('data-status'), 'confirmed');
  await settled(page);
  doc = await activeWorkspace(page);
  assert.equal(doc.steps['NO-04'].source, 'learner-confirmed');
  lesson = await waitFor(async () => { const l = (await storeDoc(page, 'progress')).data.lessons['no-04-09-capstone-crud-api']; return l?.project?.state === 'confirmed' ? l : null; });
  assert.equal(lesson.state, 'completed');
});
