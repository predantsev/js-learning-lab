// Visual players in a real browser: stepping (buttons + keyboard), counter and caption text,
// aria-live announcements, language switch keeps the step, reduced motion, no console errors,
// no horizontal overflow at 420 px and 760 px — for every visual kind.
// Run: node --test tests/e2e/visuals.test.mjs
// Needs `npx vite build` (or `npm run build`) first; the samples are compiled by the test itself.
// Also covers localized visual strings, hidden empty trace panels, the new pipeline stages, the
// legible scaling of wide pictures and "Step through" on learner code in the lesson workspace.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { startServer } from '../../server/app.mjs';
import { VISUAL_KINDS } from '../../shared/content-schema.js';
import { L1, Lab, buildFixtureDist, editorText, openApp, replaceEditor, t, waitFor } from './helpers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
let server;
let browser;
let dataDir;
let base;

before(async () => {
  const demo = path.join(ROOT, 'dist', 'app', 'visuals-demo.html');
  await fs.access(demo).catch(() => { throw new Error('dist/app/visuals-demo.html is missing: run `npx vite build` first'); });
  // Always compiled fresh: a samples.json left from an older build would test stale samples.
  const samples = path.join(ROOT, 'dist', 'content', 'visuals', 'samples.json');
  const { compileSamples } = await import('../../scripts/content/compile-visual-samples.mjs');
  const { samples: list, failures } = await compileSamples();
  assert.deepEqual(failures, []);
  await fs.mkdir(path.dirname(samples), { recursive: true });
  await fs.writeFile(samples, JSON.stringify({ samples: list }));
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
  const sampleCount = JSON.parse(await fs.readFile(path.join(ROOT, 'dist', 'content', 'visuals', 'samples.json'), 'utf8')).samples.length;
  assert.ok(sampleCount >= VISUAL_KINDS.length);
  for (const style of ['calm-studio', 'editorial', 'dev-workspace']) {
    for (const appearance of ['light', 'dark']) {
      const { page, problems } = await open(`lang=uk&style=${style}&appearance=${appearance}&width=760`);
      assert.equal(await page.locator('.viz').count(), sampleCount, `${style}/${appearance}: all players`);
      assert.deepEqual(await page.locator('.viz').evaluateAll((els) => [...new Set(els.map((el) => el.dataset.kind))].sort()), [...VISUAL_KINDS].sort(), 'every kind is on the page');
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

const panelText = (viz, name) => viz.locator(`[data-panel="${name}"]`).innerText();

test('strings: a code-trace with %%key%% runs in each language; empty panels are hidden and named instead', async () => {
  const { page, problems } = await open('only=greeting-strings&lang=uk&width=420');
  const viz = page.locator('.viz').first();
  assert.match(await viz.locator('.viz-code').innerText(), /const greeting = "Привіт";/);
  await viz.focus();
  await page.keyboard.press('ArrowRight');
  assert.match(await panelText(viz, 'variables'), /greeting\s+const\s+"Привіт"/, 'the variable holds the Ukrainian text');
  // No function is called and no object exists: those panels are not drawn, one line names them.
  assert.equal(await viz.locator('[data-panel="call-stack"]').count(), 0);
  assert.equal(await viz.locator('[data-panel="heap"]').count(), 0);
  assert.equal(await viz.locator('[data-panel="variables"]').count(), 1);
  assert.equal(await viz.locator('[data-role="hidden-panels"]').innerText(), 'Не показано, бо порожні в усіх кроках: call stack (жодна функція не викликається), heap (жодного об’єкта).');
  await page.keyboard.press('End');
  assert.equal(await viz.locator('[data-role="console"]').innerText(), 'Привіт, Олено!');
  // The same visual in English: the English run, the step kept.
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.selectOption('[data-control="lang"]', 'en');
  assert.match(await counter(page), /^Step 2 \//);
  assert.match(await viz.locator('.viz-code').innerText(), /const greeting = "Hello";/);
  assert.match(await panelText(viz, 'variables'), /greeting\s+const\s+"Hello"/);
  assert.match(await caption(page), /"Hello"/);
  assert.equal(await viz.locator('[data-role="hidden-panels"]').innerText(), 'Not shown, empty in every step: call stack (no function is called), heap (no objects).');
  await viz.focus();
  await page.keyboard.press('End');
  assert.equal(await viz.locator('[data-role="console"]').innerText(), 'Hello, Olena!');
  assert.deepEqual(await overflow(page), { page: false, viz: false, main: false });
  assert.deepEqual(problems, []);
  await page.close();
});

test('pipeline: some stops early, toSorted shows every comparison, a throwing stage shows the real error, labels follow the language', async () => {
  const { page, problems } = await open('only=habits-some&lang=en&width=420');
  const viz = page.locator('.viz').first();
  const statuses = () => viz.locator('.viz-items:not(.viz-items-out) .viz-item').evaluateAll((els) => els.map((el) => el.dataset.status));
  await viz.focus();
  await page.keyboard.press('ArrowRight');
  assert.deepEqual(await statuses(), ['nomatch', 'waiting', 'waiting', 'waiting']);
  assert.equal(await viz.locator('[data-output="pending"]').count(), 1, 'not decided yet');
  await page.keyboard.press('ArrowRight');
  assert.deepEqual(await statuses(), ['nomatch', 'match', 'skipped', 'skipped'], 'the short-circuit: the last two are never checked');
  assert.equal(await viz.locator('.viz-items-out .viz-item-value').innerText(), 'true');
  assert.match(await viz.locator('.viz-items').first().innerText(), /h-1 · missed 0/);
  await page.selectOption('[data-control="lang"]', 'uk');
  assert.match(await viz.locator('.viz-items').first().innerText(), /h-1 · пропущено 0/, 'bilingual item labels');
  assert.match(await viz.locator('.viz-items').first().innerText(), /не перевірено/);
  await page.close();

  const sorted = await open('only=prices-tosorted&lang=en&width=420');
  const sortViz = sorted.page.locator('.viz').first();
  await sortViz.focus();
  await sorted.page.keyboard.press('ArrowRight');
  assert.match(await sortViz.locator('.viz-predicate').innerText(), /^\.toSorted\(/, 'toSorted keeps its own name');
  assert.match(await sortViz.locator('[data-role="compare"]').innerText(), /^comparison 1 of \d+: a = 240, b = 45 → 195 · above zero: b goes before a$/);
  assert.equal(await sortViz.locator('[data-compare="a"] .viz-item-label').innerText(), '240');
  assert.equal(await sortViz.locator('[data-compare="b"] .viz-item-label').innerText(), '45');
  await sorted.page.keyboard.press('End');
  assert.deepEqual(await sortViz.locator('.viz-items-out .viz-item-label').allInnerTexts(), ['45', '80', '240']);
  assert.deepEqual(sorted.problems, []);
  await sorted.page.close();

  const thrown = await open('only=notes-map-throws&lang=en&width=420');
  const errViz = thrown.page.locator('.viz').first();
  await errViz.focus();
  await thrown.page.keyboard.press('End');
  let real;
  try { undefined.trim(); } catch (error) { real = error; }
  assert.equal(await errViz.locator('[data-output="error"] .viz-item-label').innerText(), `${real.name}: ${real.message}`, 'the real error of the stage');
  assert.equal(await errViz.locator('.viz-item[data-status="error"] .viz-item-label').innerText(), 'Mug €12');
  assert.deepEqual(thrown.problems, []);
  assert.deepEqual(problems, []);
  await thrown.page.close();
});

test('wide pictures: diagram, sequence and memory-graph scale down to the lesson column; below 75 % the panel scrolls instead', async () => {
  const measure = (page, sample) => page.evaluate((id) => {
    const article = document.querySelector(`[data-sample="${id}"]`);
    const panel = article.querySelector('.viz-svg-panel');
    const svg = article.querySelector('.viz-svg');
    return { natural: Number(svg.getAttribute('width')), rendered: svg.getBoundingClientRect().width, scrolls: panel.scrollWidth > panel.clientWidth + 1 };
  }, sample);
  const { page, problems } = await open('lang=en&width=420');
  for (const sample of ['browser-server-database', 'cors-preflight', 'shared-reference-vs-copy']) {
    const m = await measure(page, sample);
    assert.ok(m.natural <= 460, `${sample}: within the width guidance (${m.natural} px)`);
    assert.equal(m.scrolls, false, `${sample}: no horizontal scrolling at 420 px`);
    assert.ok(m.rendered / m.natural >= 0.75 - 0.005 && m.rendered <= m.natural + 0.5, `${sample}: scaled to ${(m.rendered / m.natural).toFixed(3)}`);
  }
  assert.deepEqual(problems, []);
  await page.close();
  // A column narrower than 75 % of the picture: the picture stops at the legible minimum and its panel scrolls.
  const narrow = await open('lang=en&only=diagram', { width: 300 });
  const m = await measure(narrow.page, 'browser-server-database');
  assert.equal(m.scrolls, true);
  assert.ok(Math.abs(m.rendered - Math.round(m.natural * 0.75)) <= 1, `rendered at the 75 % minimum (${m.rendered} of ${m.natural})`);
  await narrow.page.close();
});

test('memory-graph boxes and code panels follow their content within the column: identifiers stay whole, holes are shown', async () => {
  const { page, problems } = await open('only=sparse-reminders&lang=en&width=420');
  const read = () => page.evaluate(() => {
    const code = document.querySelector('.viz-code');
    const panel = document.querySelector('.viz-svg-panel');
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const boxes = [...document.querySelectorAll('.viz-binding')].map((g) => ({ text: g.querySelector('text').textContent, full: g.querySelector('title')?.textContent ?? null, textW: g.querySelector('text').getComputedTextLength(), boxW: Number(g.querySelector('rect').getAttribute('width')) }));
    return { codeScrolls: code.scrollWidth > code.clientWidth + 1, codeFont: parseFloat(getComputedStyle(code).fontSize), minFont: rootPx * 0.72, panelScrolls: panel.scrollWidth > panel.clientWidth + 1, boxes, svgText: document.querySelector('.viz-svg').textContent };
  });
  const first = await read();
  assert.equal(first.codeScrolls, false, 'long code lines shrink, then wrap: no sideways scrolling');
  assert.ok(first.codeFont >= first.minFont - 0.01, `code font ${first.codeFont}px is not below the legible minimum ${first.minFont}px`);
  assert.equal(first.panelScrolls, false, 'the picture fits the 420 px column');
  for (const box of first.boxes) assert.ok(box.textW + 8 <= box.boxW, `"${box.text}" fits its box (${box.textW.toFixed(0)} of ${box.boxW} px)`);
  assert.equal(first.boxes[0].text, 'scheduledReminders → #r1');
  assert.match(first.boxes[1].text, /^remindersWithoutHoles = .*…$/, 'the identifier stays whole; only the value is shortened');
  assert.equal(first.boxes[1].full, 'remindersWithoutHoles = uninitialized (TDZ)', 'the full text stays available');
  assert.match(first.svgText, /1: <empty>/, 'the hole of the sparse array');
  await page.locator('.viz [data-action="next"]').first().click();
  const second = await read();
  assert.equal(second.boxes[1].text, 'remindersWithoutHoles → #r2');
  assert.equal(second.panelScrolls, false);
  assert.deepEqual(problems, []);
  await page.close();
  // Short code keeps the normal code size.
  const wide = await open('only=code-trace&lang=en&width=760');
  const sizes = await wide.page.evaluate(() => ({ code: parseFloat(getComputedStyle(document.querySelector('.viz-code')).fontSize), normal: parseFloat(getComputedStyle(document.querySelector('.viz')).getPropertyValue('--viz-code-size')) * parseFloat(getComputedStyle(document.documentElement).fontSize) }));
  assert.ok(Math.abs(sizes.code - sizes.normal) < 0.01, `short code is not shrunk (${sizes.code}px vs ${sizes.normal}px)`);
  await wide.page.close();
});

test('step through my code: the lesson workspace traces the learner code and shows it in the code-trace player', async () => {
  const distDir = await buildFixtureDist();
  const lab = await Lab.start({ distDir });
  try {
    await lab.seed('profile', { language: 'uk', styleId: 'calm-studio', appearance: 'system', textSize: 'default', activeWorkspaceId: null, lastLesson: null, onboardingDone: true, createdAt: '2026-10-01T00:00:00.000Z' });
    const { page, problems, context } = await openApp(browser, lab, { hash: `#/lesson/${L1}/1` });
    await page.locator('#block-basics-example').waitFor();
    const ws = page.locator('.ws');
    const stepThrough = (lang = 'uk') => ws.locator('.ws-actions').getByRole('button', { name: t(lang, 'ws.trace'), exact: true });
    const player = ws.locator('.viz[data-kind="code-trace"]');
    const playerCounter = () => player.locator('[data-role="counter"]').innerText();

    const code = 'function double(n) {\n  return n * 2;\n}\nconst order = { total: 0 };\nfor (let i = 1; i <= 2; i++) {\n  order.total += double(i);\n}\nconsole.log(order.total);\n';
    await replaceEditor(page, code);
    await stepThrough().click();
    assert.equal(await ws.getByRole('tab', { name: t('uk', 'ws.steps') }).getAttribute('aria-selected'), 'true');
    await player.waitFor({ timeout: 20_000 });
    assert.match(await playerCounter(), /^Крок 1 \/ \d+$/);
    assert.match(await player.locator('[data-role="caption"]').innerText(), /^1\.\s+Рядок 4$/, 'no caption: the player names the line, in the learner language');
    // Walk to the first call of double: call stack and heap are real.
    await player.focus();
    const total = Number((await playerCounter()).split('/')[1]);
    // (A step without an event has no event line: read the whole player instead of waiting for one.)
    for (let i = 1; i < total && !/→ виклик double\(n = 1\)/.test(await player.innerText()); i++) await page.keyboard.press('ArrowRight');
    assert.match(await player.locator('[data-role="event"]').innerText(), /→ виклик double\(n = 1\)/);
    assert.match(await player.locator('[data-panel="call-stack"]').innerText(), /double\s+Рядок 1/);
    assert.match(await player.locator('[data-panel="heap"]').innerText(), /ƒ double/);
    // The UI language switch keeps the trace and the step; the player speaks English.
    const stepNo = (await playerCounter()).match(/\d+/)[0];
    await page.locator('.lang-switch').getByRole('button', { name: 'EN', exact: true }).click();
    await waitFor(async () => (await playerCounter()).startsWith('Step'), { message: 'English player labels' });
    assert.equal((await playerCounter()).match(/\d+/)[0], stepNo);
    assert.match(await player.locator('[data-role="event"]').innerText(), /→ call double\(n = 1\)/);
    await player.focus();
    await page.keyboard.press('End');
    assert.equal(await player.locator('[data-role="console"]').innerText(), '6');
    await page.locator('.lang-switch').getByRole('button', { name: 'UA', exact: true }).click();
    assert.equal(await editorText(page), code, 'tracing never changes the learner code');

    // A syntax error: a clear message and the diagnostic, no player.
    await replaceEditor(page, 'const = 1;\n');
    await stepThrough().click();
    const notRun = ws.locator('[data-trace="not-run"]');
    await notRun.waitFor({ timeout: 20_000 });
    assert.equal((await notRun.locator('.ws-note').innerText()).trim(), t('uk', 'ws.traceSyntax'));
    assert.ok(await notRun.locator('.error-card').count() > 0);
    assert.equal(await player.count(), 0);

    // A long loop: the trace is cut at 400 steps and says so.
    await replaceEditor(page, 'let n = 0;\nfor (let i = 0; i < 1000; i++) {\n  n += i;\n}\nconsole.log(n);\n');
    await stepThrough().click();
    const cut = ws.locator('[data-role="trace-truncated"]');
    await cut.waitFor({ timeout: 20_000 });
    assert.equal((await cut.innerText()).trim(), t('uk', 'ws.traceTruncated', { n: 400 }));
    assert.match(await playerCounter(), /^Крок 1 \/ 400$/);

    // An uncaught error in the module body: the last step is where the program stopped.
    await replaceEditor(page, 'const user = null;\nconsole.log("before");\nconsole.log(user.name);\n');
    await stepThrough().click();
    const stopped = ws.locator('[data-role="trace-error"]');
    await stopped.waitFor({ timeout: 20_000 });
    assert.match(await stopped.innerText(), /TypeError: Cannot read properties of null \(reading 'name'\)/);
    await player.focus();
    await page.keyboard.press('End');
    assert.match(await player.locator('[data-role="event"]').innerText(), /необроблена помилка: TypeError/);
    assert.match(await player.locator('[data-role="caption"]').innerText(), /Рядок 3$/);
    assert.equal(await player.locator('[data-role="console"]').innerText(), 'before');

    // Several modules (the exercise on page 2): every step shows the file it runs in.
    await page.evaluate((id) => { location.hash = `#/lesson/${id}/2`; }, L1);
    await page.locator('#block-basics-exercise').waitFor();
    await stepThrough().click();
    await player.waitFor({ timeout: 20_000 });
    assert.equal(await player.locator('.viz-file').innerText(), 'label.js', 'an imported module runs first');
    await player.focus();
    await page.keyboard.press('End');
    assert.equal(await player.locator('.viz-file').innerText(), 'index.js');

    // An HTML page with an inline <script type="module">: its steps show the script's own code.
    await page.evaluate(() => { location.hash = '#/lesson/js-02-01-fixture-pages/1'; });
    await page.locator('#block-pages-site').waitFor();
    await replaceEditor(page, '<!doctype html>\n<p id="out"></p>\n<script type="module">\nconst out = document.getElementById("out");\nout.textContent = "hi";\nconsole.log(out.textContent);\n</script>\n');
    await stepThrough().click();
    await player.waitFor({ timeout: 20_000 });
    assert.equal(await player.locator('.viz-file').innerText(), 'index.html.inline-1.js');
    assert.match(await player.locator('.viz-code').innerText(), /const out = document\.getElementById\("out"\);/);
    assert.match(await player.locator('.viz-code-line.viz-current').innerText(), /const out = document\.getElementById/, 'the highlighted line is the running line of the script');
    await player.focus();
    await page.keyboard.press('End');
    assert.equal(await player.locator('[data-role="console"]').innerText(), 'hi');
    // The TypeError above is the learner program's own (thrown inside the sandbox frame on purpose).
    assert.deepEqual(problems.filter((p) => p !== "pageerror: Cannot read properties of null (reading 'name')"), []);
    await context.close();
  } finally {
    await lab.dispose();
    await fs.rm(distDir, { recursive: true, force: true });
  }
});
