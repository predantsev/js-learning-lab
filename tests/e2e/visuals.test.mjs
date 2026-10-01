// Visual players in a real browser: stepping (buttons + keyboard), counter and caption text,
// aria-live announcements, language switch keeps the step, reduced motion, no console errors,
// no horizontal overflow at 420 px and 760 px — for every visual kind.
// Run: node --test tests/e2e/visuals.test.mjs
// Needs `npx vite build` and `node scripts/content/compile-visual-samples.mjs` first (the test
// runs the sample compiler itself when dist/content/visuals/samples.json is missing).
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { startServer } from '../../server/app.mjs';
import { VISUAL_KINDS } from '../../shared/content-schema.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
let server;
let browser;
let dataDir;
let base;

before(async () => {
  const demo = path.join(ROOT, 'dist', 'app', 'visuals-demo.html');
  await fs.access(demo).catch(() => { throw new Error('dist/app/visuals-demo.html is missing: run `npx vite build` first'); });
  const samples = path.join(ROOT, 'dist', 'content', 'visuals', 'samples.json');
  if (!(await fs.access(samples).then(() => true, () => false))) {
    const { compileSamples } = await import('../../scripts/content/compile-visual-samples.mjs');
    const { samples: list, failures } = await compileSamples();
    assert.deepEqual(failures, []);
    await fs.mkdir(path.dirname(samples), { recursive: true });
    await fs.writeFile(samples, JSON.stringify({ samples: list }));
  }
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-visuals-'));
  server = await startServer({ port: 0, dataDir, quiet: true });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  base = `http://js-learning-lab.localhost:${server.port}/visuals-demo.html`;
});

after(async () => {
  await browser?.close();
  await server?.close();
  await fs.rm(dataDir, { recursive: true, force: true });
});

async function open(query, { width = 1000, reducedMotion = 'no-preference' } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
  const problems = [];
  // "Failed to load resource" console entries carry no URL; failed responses are checked by URL instead.
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problems.push(`console.error: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400 && !/favicon\.ico$/.test(r.url())) problems.push(`HTTP ${r.status()} ${r.url()}`); });
  await page.goto(`${base}?${query}`);
  await page.waitForFunction(() => document.documentElement.dataset.demo === 'ready', null, { timeout: 15000 });
  await page.waitForSelector('.viz [data-action="next"]');
  return { page, problems };
}
const counter = (page) => page.locator('.viz [data-role="counter"]').first().innerText();
const caption = (page) => page.locator('.viz [data-role="caption"]').first().innerText();
const overflow = (page) => page.evaluate(() => {
  const main = document.querySelector('.demo-main');
  const viz = document.querySelector('.viz');
  return { page: document.documentElement.scrollWidth > document.documentElement.clientWidth, viz: viz.scrollWidth > viz.clientWidth + 1, main: main.scrollWidth > main.clientWidth + 1 };
});

for (const kind of VISUAL_KINDS) {
  test(`${kind}: buttons and keyboard step through, captions change and are announced`, async () => {
    const { page, problems } = await open(`only=${kind}&lang=uk`);
    const total = await page.evaluate(() => document.querySelectorAll('.viz [data-action]').length);
    assert.ok(total >= 4, 'controls present');
    assert.equal(await counter(page), `Крок 1 / ${await page.evaluate(() => Number(document.querySelector('.viz [data-role="counter"]').textContent.split('/')[1]))}`);
    assert.equal(await page.locator('.viz [data-action="prev"]').first().isDisabled(), true, 'Previous disabled on the first step');
    const live = await page.locator('.viz [data-role="caption"]').first().getAttribute('aria-live');
    assert.equal(live, 'polite');
    const first = await caption(page);
    assert.match(first, /^1\./);
    await page.locator('.viz [data-action="next"]').first().click();
    assert.match(await counter(page), /^Крок 2 \//);
    const second = await caption(page);
    assert.notEqual(second, first, 'caption changes');
    assert.match(second, /^2\./);
    // Keyboard: focus the player, ArrowRight / ArrowLeft / Home.
    await page.locator('.viz').first().focus();
    await page.keyboard.press('ArrowRight');
    assert.match(await counter(page), /^Крок 3 \//);
    await page.keyboard.press('ArrowLeft');
    assert.match(await counter(page), /^Крок 2 \//);
    await page.keyboard.press('Home');
    assert.match(await counter(page), /^Крок 1 \//);
    assert.equal(await caption(page), first);
    // Walk to the end: Next becomes disabled, Reset returns to step 1.
    const last = await page.evaluate(() => Number(document.querySelector('.viz [data-role="counter"]').textContent.split('/')[1]));
    for (let i = 1; i < last; i++) await page.locator('.viz [data-action="next"]').first().click();
    assert.equal(await page.locator('.viz [data-action="next"]').first().isDisabled(), true, 'Next disabled on the last step');
    assert.match(await counter(page), new RegExp(`^Крок ${last} / ${last}`));
    await page.locator('.viz [data-action="reset"]').first().click();
    assert.match(await counter(page), /^Крок 1 \//);
    assert.deepEqual(problems, []);
    await page.close();
  });

  test(`${kind}: the language switch keeps the step; no horizontal overflow at 420 px and 760 px`, async () => {
    const { page, problems } = await open(`only=${kind}&lang=uk&width=760`);
    await page.locator('.viz [data-action="next"]').first().click();
    await page.locator('.viz [data-action="next"]').first().click();
    const ukCaption = await caption(page);
    await page.selectOption('[data-control="lang"]', 'en');
    assert.match(await counter(page), /^Step 3 \//, 'step kept after switching to English');
    const enCaption = await caption(page);
    assert.notEqual(enCaption, ukCaption, 'caption is translated');
    assert.match(enCaption, /^3\./);
    assert.equal(await page.locator('.viz [data-action="next"]').first().innerText(), 'Next ›');
    let o = await overflow(page);
    assert.deepEqual(o, { page: false, viz: false, main: false }, '760 px');
    await page.selectOption('[data-control="width"]', '420');
    await page.waitForTimeout(50);
    o = await overflow(page);
    assert.deepEqual(o, { page: false, viz: false, main: false }, '420 px');
    assert.match(await counter(page), /^Step 3 \//, 'step kept after resizing');
    assert.deepEqual(problems, []);
    await page.close();
  });
}

test('reduced motion: the player marks itself and no element animates while stepping', async () => {
  const { page, problems } = await open('only=code-trace&lang=en&reduced=1', { reducedMotion: 'reduce' });
  assert.equal(await page.locator('.viz').first().getAttribute('data-reduced'), 'true');
  await page.locator('.viz [data-action="next"]').first().click();
  const animated = await page.evaluate(() => [...document.querySelectorAll('.viz .viz-changed')].filter((el) => { const a = getComputedStyle(el).animationName; return a && a !== 'none'; }).length);
  assert.equal(animated, 0, 'no running animation with reduced motion');
  assert.ok(await page.locator('.viz .viz-changed').count() > 0, 'changes are still marked');
  await page.locator('.viz [data-action="play"]').first().click();
  assert.equal(await page.locator('.viz [data-action="play"]').first().getAttribute('aria-pressed'), 'true');
  await page.locator('.viz [data-action="play"]').first().click();
  assert.equal(await page.locator('.viz [data-action="play"]').first().getAttribute('aria-pressed'), 'false');
  assert.deepEqual(problems, []);
  await page.close();
});

test('motion: a one-shot highlight runs once on a step change (no infinite animation)', async () => {
  const { page } = await open('only=pipeline&lang=en');
  await page.locator('.viz [data-action="next"]').first().click();
  const info = await page.evaluate(() => {
    const el = document.querySelector('.viz .viz-changed');
    const s = getComputedStyle(el);
    return { name: s.animationName, iterations: s.animationIterationCount, duration: s.animationDuration };
  });
  assert.equal(info.name, 'viz-pop');
  assert.equal(info.iterations, '1');
  assert.equal(info.duration, '0.45s');
  await page.close();
});

test('autoplay advances by itself and any manual action pauses it', async () => {
  const { page } = await open('only=git-graph&lang=en');
  await page.locator('.viz [data-action="play"]').first().click();
  await page.waitForFunction(() => document.querySelector('.viz [data-role="counter"]').textContent.startsWith('Step 2'), null, { timeout: 4000 });
  await page.locator('.viz [data-action="prev"]').first().click();
  assert.equal(await page.locator('.viz [data-action="play"]').first().getAttribute('aria-pressed'), 'false', 'paused by a manual action');
  assert.match(await counter(page), /^Step 1 \//);
  await page.close();
});

test('code-trace shows real execution state: variables table, call stack, heap identity and console', async () => {
  const { page } = await open('only=code-trace&lang=en');
  await page.locator('.viz').first().focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  const text = await page.locator('.viz').first().innerText();
  assert.match(text, /captured scope: function makeCounter/i);
  assert.match(text, /count\s+let\s+0/);
  assert.match(text, /call stack/i);
  assert.match(text, /increment\s+Line 3/);
  assert.ok((await page.locator('.viz table.viz-vars').count()) >= 2, 'variables are real tables');
  await page.keyboard.press('End');
  const end = await page.locator('.viz [data-role="console"]').first().innerText();
  assert.match(end, /clicks: 3/);
  assert.match(end, /views: 102/);
  await page.close();
});

test('all three styles and both appearances render every kind without errors', async () => {
  for (const style of ['calm-studio', 'editorial', 'dev-workspace']) {
    for (const appearance of ['light', 'dark']) {
      const { page, problems } = await open(`lang=uk&style=${style}&appearance=${appearance}&width=760`);
      assert.equal(await page.locator('.viz').count(), VISUAL_KINDS.length, `${style}/${appearance}: all players`);
      const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.viz .viz-btn-primary')).backgroundColor);
      assert.notEqual(bg, 'rgba(0, 0, 0, 0)', 'tokens applied');
      assert.deepEqual(problems, [], `${style}/${appearance}`);
      assert.equal((await overflow(page)).page, false);
      await page.close();
    }
  }
});

test('run time: the real sandbox returns a trace of the learner module with the compiled shape', async () => {
  // Module-mode instrumentation (imports rewritten, export kept) executed by the actual sandbox runtime;
  // the `trace` event is the same shape the code-trace player consumes (traceToSpec).
  const { transformScript } = await import('../../shared/transform.js');
  const { traceBabelPlugin, traceToSpec } = await import('../../shared/visuals/index.js');
  const files = {
    'index.js': 'import { double } from "./util.js";\nexport const items = [1, 2];\nlet total = 0;\nfor (const n of items) {\n  total += double(n);\n}\nconsole.log("total", total);\n',
    'util.js': 'export function double(n) {\n  return n * 2;\n}\n',
  };
  const traced = {};
  for (const [file, source] of Object.entries(files)) {
    const out = transformScript(file, source, { files, extraPlugins: [[traceBabelPlugin, { file }]] });
    assert.ok(out.code, JSON.stringify(out.error));
    traced[file] = out.code;
  }
  const page = await browser.newPage();
  await page.goto(`http://js-learning-lab.localhost:${server.port}/harness.html`);
  await page.waitForFunction(() => document.documentElement.dataset.harness === 'ready');
  const result = await page.evaluate(({ files: f, traced: t }) => new Promise((resolve) => {
    const sandboxOrigin = window.jsll.sandboxOriginFor(window.jsll.port);
    const prepared = window.jsll.prepareRun({ files: f, entry: 'index.js', runtime: 'browser-js', sandboxOrigin, options: { trace: true } });
    if ('errors' in prepared) return resolve({ compileErrors: prepared.errors });
    Object.assign(prepared.payload.modules, t);
    prepared.payload.options.offscreen = true;
    const container = document.createElement('div');
    document.getElementById('stage').append(container);
    const out = { trace: null, console: [], errors: [], status: 'running' };
    const run = new window.jsll.SandboxRun({ container, sandboxOrigin, prepared, visible: false, onEvent: (event) => {
      if (event.type === 'trace') out.trace = event.trace;
      else if (event.type === 'console') out.console.push(...event.entries);
      else if (event.type === 'error') out.errors.push(event.error);
      else if (event.type === 'done' || event.type === 'failed') { out.status = event.type; setTimeout(() => { run.stop(); resolve(out); }, 30); }
    } });
    run.start();
    setTimeout(() => { out.status = 'timeout'; run.stop(); resolve(out); }, 15000);
    return undefined;
  }), { files, traced });
  assert.equal(result.status, 'done', JSON.stringify(result.errors ?? result.compileErrors));
  assert.deepEqual(result.errors, []);
  assert.ok(result.trace, 'trace event received');
  const spec = traceToSpec(result.trace, files['index.js'], 'index.js');
  assert.equal(spec.kind, 'code-trace');
  assert.ok(spec.steps.length > 8);
  assert.deepEqual(spec.console, [{ level: 'log', text: 'total 6' }]);
  const kinds = new Set(spec.steps.map((s) => s.trace.kind));
  for (const k of ['stmt', 'iter', 'call', 'return', 'end']) assert.ok(kinds.has(k), k);
  const inDouble = spec.steps.find((s) => s.trace.kind === 'return' && s.trace.event.name === 'double');
  assert.deepEqual(inDouble.trace.frames.map((f) => f.name), ['index.js', 'double']);
  assert.equal(inDouble.trace.file, 'util.js');
  const last = spec.steps.at(-1).trace;
  const moduleScope = Object.values(last.scopes).find((s) => s.kind === 'module' && s.name === 'index.js');
  assert.deepEqual(moduleScope.vars.map((v) => `${v.name}:${v.kind}`), ['double:import', 'items:const', 'total:let']);
  assert.equal(moduleScope.vars[2].value.v, 6);
  assert.equal(spec.steps.at(-1).logged, 1);
  await page.close();
});
