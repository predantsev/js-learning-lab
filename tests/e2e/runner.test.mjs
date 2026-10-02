// Runner behavior in a real browser (V-11): real output, isolation, interruption, recovery.
// Run: node --test tests/e2e/runner.test.mjs   (needs `npm run build` first; uses installed Chrome)
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { startServer } from '../../server/app.mjs';

let server;
let browser;
let page;
let dataDir;

before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-runner-'));
  server = await startServer({ port: 0, dataDir, quiet: true });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  page = await browser.newPage();
  await page.goto(`http://js-learning-lab.localhost:${server.port}/harness.html`);
  await page.waitForFunction(() => document.documentElement.dataset.harness === 'ready');
});

after(async () => {
  await browser?.close();
  await server?.close();
  await fs.rm(dataDir, { recursive: true, force: true });
});

const run = (input) => page.evaluate((i) => window.jsll.runProject(i), { runtime: 'browser-js', entry: 'index.js', ...input });
const logs = (result) => result.console.filter((e) => e.level !== 'system').map((e) => e.args.map((a) => (a.v !== undefined ? String(a.v) : a.t)).join(' '));
const systemCodes = (result) => result.console.filter((e) => e.level === 'system').map((e) => e.code);

test('learner code produces real output and edits change it', async () => {
  const a = await run({ files: { 'index.js': 'console.log(6 * 7);' } });
  assert.equal(a.status, 'done');
  assert.deepEqual(logs(a), ['42']);
  const b = await run({ files: { 'index.js': 'console.log(6 * 8, "ok", [1, { a: 2 }], null, undefined);' } });
  assert.equal(b.console[0].args[0].v, 48);
  assert.equal(b.console[0].args[2].t, 'array');
  assert.deepEqual(b.console[0].args.slice(3).map((x) => x.t), ['null', 'undefined']);
});

test('multi-file ES modules, JSON import and live bindings work natively', async () => {
  const r = await run({
    files: {
      'index.js': 'import { count, bump } from "./counter.js";\nimport data from "./data.json";\nbump();\nconsole.log(count, data.items.length);',
      'counter.js': 'export let count = 0;\nexport function bump() { count += 1; }',
      'data.json': '{"items":[1,2,3]}',
    },
  });
  assert.deepEqual(logs(r), ['1 3']);
  assert.equal(r.errors.length, 0);
});

test('a missing file extension is explained before running', async () => {
  const r = await run({ files: { 'index.js': 'import { a } from "./util";', 'util.js': 'export const a = 1;' } });
  assert.equal(r.status, 'compile-error');
  assert.equal(r.compileErrors[0].code, 'missing-extension');
});

test('syntax errors report file, line and column without running', async () => {
  const r = await run({ files: { 'index.js': 'const a = 1;\nconst b = ;\n' } });
  assert.equal(r.status, 'compile-error');
  assert.equal(r.compileErrors[0].kind, 'syntax');
  assert.equal(r.compileErrors[0].line, 2);
  assert.equal(r.compileErrors[0].file, 'index.js');
});

test('runtime errors keep the learner file name and line', async () => {
  const r = await run({ files: { 'index.js': 'const user = null;\n\nconsole.log("before");\nconsole.log(user.name);\n' } });
  assert.equal(r.errors.length, 1);
  assert.equal(r.errors[0].name, 'TypeError');
  assert.equal(r.errors[0].line, 4);
  assert.match(r.errors[0].file, /index\.js$/);
  assert.deepEqual(logs(r), ['before']);
});

test('unhandled promise rejections are reported', async () => {
  const r = await run({ files: { 'index.js': 'Promise.reject(new Error("nope"));' } });
  assert.equal(r.errors[0].phase, 'unhandled-rejection');
  assert.equal(r.errors[0].message, 'nope');
});

test('an infinite loop is stopped by the loop budget and the frame stays usable', async () => {
  const r = await run({ files: { 'index.js': 'console.log("start");\nlet i = 0;\nwhile (true) { i++; }\n' }, options: { loopBudgetMs: 300 } });
  assert.equal(r.status, 'done');
  assert.equal(r.errors[0].name, 'LoopBudgetError');
  assert.equal(r.errors[0].line, 3);
  assert.deepEqual(logs(r), ['start']);
});

test('an infinite loop that prints on every iteration is still stopped by the loop budget', async () => {
  const r = await run({ files: { 'index.js': 'let i = 0;\nwhile (true) { console.log("tick", i++); }\n' }, options: { loopBudgetMs: 400 } });
  assert.equal(r.status, 'done');
  assert.equal(r.errors[0].name, 'LoopBudgetError');
  assert.ok(systemCodes(r).includes('console-limit'));
});

test('a synchronous runaway DOM loop cannot freeze the platform page; stop and rerun recover', async () => {
  const ticksBefore = await page.evaluate(() => { window.__ticks = 0; window.__timer = setInterval(() => { window.__ticks += 1; }, 20); return 0; });
  const started = Date.now();
  const r = await run({ files: { 'index.html': '<p id="out"></p><script type="module">let i = 0; const out = document.getElementById("out"); for (;;) { out.textContent = String(i++); }</script>' }, entry: 'index.html', options: { loopBudgetMs: 0, unresponsiveAfterMs: 1200 } });
  assert.equal(r.status, 'unresponsive');
  const ticks = await page.evaluate(() => { clearInterval(window.__timer); return window.__ticks; });
  const elapsed = Date.now() - started;
  assert.ok(ticks > elapsed / 20 / 3, `platform page kept running timers during the runaway loop (${ticks} ticks in ${elapsed} ms)`);
  const again = await run({ files: { 'index.js': 'console.log("fresh context");' } });
  assert.equal(again.status, 'done');
  assert.deepEqual(logs(again), ['fresh context']);
  assert.equal(ticksBefore, 0);
});

test('unbounded recursion surfaces RangeError and does not kill the sandbox', async () => {
  const r = await run({ files: { 'index.js': 'function f(n) { return f(n + 1); }\ntry { f(0); } catch (e) { console.log(e.name); }\nf(0);' } });
  assert.deepEqual(logs(r), ['RangeError']);
  assert.equal(r.errors[0].name, 'RangeError');
  assert.equal(r.status, 'done');
});

test('console floods are cut off with an explanation', async () => {
  const r = await run({ files: { 'index.js': 'for (let i = 0; i < 20000; i++) console.log("line", i);\nconsole.log("end");' } });
  assert.ok(r.console.length <= 402, `capped at the console limit, got ${r.console.length}`);
  assert.ok(systemCodes(r).includes('console-limit'));
  assert.equal(r.status, 'done');
});

test('unknown packages and Node modules are rejected with clear messages', async () => {
  const a = await run({ files: { 'index.js': 'import _ from "lodash";' } });
  assert.equal(a.compileErrors[0].code, 'unknown-package');
  const b = await run({ files: { 'index.js': 'import fs from "node:fs";' } });
  assert.equal(b.compileErrors[0].code, 'node-module-in-browser');
});

test('network is denied by default and limited to lab fixtures when enabled', async () => {
  const denied = await run({ files: { 'index.js': 'try { await fetch("https://example.com/"); console.log("reached"); } catch (e) { console.log(e.name); }\ntry { await fetch("/lab/ping"); console.log("lab reached"); } catch (e) { console.log(e.name); }' } });
  assert.deepEqual(logs(denied), ['TypeError', 'TypeError']);
  assert.deepEqual(systemCodes(denied), ['network-blocked', 'network-blocked']);
  const lab = await run({ files: { 'index.js': 'const r = await fetch("/lab/ping"); const body = await r.json(); console.log(r.status, body.ok);\ntry { await fetch("https://example.com/"); } catch (e) { console.log(e.name); }' }, options: { network: 'lab' } });
  assert.deepEqual(logs(lab), ['200 true', 'TypeError']);
});

test('project files are served to fetch() without any network', async () => {
  const r = await run({ files: { 'index.js': 'const r = await fetch("./data/items.json"); console.log(r.status, (await r.json()).length);\nconst missing = await fetch("./nope.json"); console.log(missing.status);', 'data/items.json': '[1,2]' } });
  assert.deepEqual(logs(r), ['200 2', '404']);
});

test('learner code cannot reach the platform page, its storage or the API', async () => {
  await page.evaluate(() => localStorage.setItem('platform-probe', 'secret'));
  const probe = (expr) => `(() => { try { return "reached:" + (${expr}); } catch (e) { return "denied:" + e.name; } })()`;
  const r = await run({
    files: {
      'index.js': [
        `console.log(${probe('parent.document.title')});`,
        `console.log(${probe('parent.localStorage.getItem("platform-probe")')});`,
        `console.log(${probe('top.location.href')});`,
        `console.log(${probe('document.cookie')});`,
        `console.log(${probe('window.origin')});`,
        'try { const res = await fetch("/api/bootstrap"); console.log("api:" + res.status); } catch (e) { console.log("api-denied:" + e.name); }',
        'try { const res = await fetch("http://localhost:" + location.port + "/"); console.log("app:" + res.status); } catch (e) { console.log("app-denied:" + e.name); }',
      ].join('\n'),
    },
  });
  assert.deepEqual(logs(r), ['denied:SecurityError', 'denied:SecurityError', 'denied:SecurityError', 'denied:SecurityError', 'reached:null', 'api-denied:TypeError', 'app-denied:TypeError']);
  assert.equal(await page.evaluate(() => localStorage.getItem('platform-probe')), 'secret');
});

test('sandbox storage is visible to the learner, isolated from the platform and restorable', async () => {
  const first = await run({ files: { 'index.js': 'localStorage.setItem("wishes", JSON.stringify([1, 2]));\nlocalStorage.note = "kept";\nconsole.log(localStorage.length);' } });
  assert.deepEqual(logs(first), ['2']);
  assert.deepEqual(first.storage, { wishes: '[1,2]', note: 'kept' });
  assert.equal(await page.evaluate(() => localStorage.getItem('wishes')), null);
  const second = await run({ files: { 'index.js': 'console.log(localStorage.getItem("wishes"), localStorage.getItem("missing"));' }, storage: first.storage });
  assert.deepEqual(logs(second), ['[1,2] null']);
});

test('HTML documents follow real parser order; styles and module scripts load from project files', async () => {
  const r = await run({
    entry: 'index.html',
    files: {
      'index.html': '<!doctype html><html lang="uk"><head><title>Мій список</title><link rel="stylesheet" href="styles.css"><script>console.log("head sees body:", document.body === null ? "no" : "yes");</script></head><body><h1 id="t">Привіт</h1><script type="module" src="./src/main.js"></script></body></html>',
      'styles.css': 'h1 { color: rgb(1, 2, 3); }',
      'src/main.js': 'import { label } from "./label.js";\nconst h = document.querySelector("#t");\nh.textContent = label;\nconsole.log(getComputedStyle(h).color, document.title, document.documentElement.lang);',
      'src/label.js': 'export const label = "Готово";',
    },
    tests: { path: '__tests__.js', source: 'import { label } from "./src/label.js";\ntest("heading updated", () => { expect(document.querySelector("#t")).toHaveTextContent(label); });' },
  });
  assert.deepEqual(logs(r), ['head sees body: no', 'rgb(1, 2, 3) Мій список uk']);
  assert.deepEqual(r.tests.map((t) => t.status), ['pass']);
});

test('behavior tests see top-level bindings, console output, DOM events and async code', async () => {
  const files = {
    'index.html': '<form id="f"><label>Назва <input id="name"></label><button>Додати</button></form><ul id="list"></ul><script type="module" src="./app.js"></script>',
    'app.js': 'const items = [];\nconst price = 45;\nfunction add(name) { items.push(name); render(); }\nfunction render() { document.querySelector("#list").innerHTML = items.map((i) => `<li>${i}</li>`).join(""); }\ndocument.querySelector("#f").addEventListener("submit", (e) => { e.preventDefault(); const input = document.querySelector("#name"); if (input.value.trim()) add(input.value.trim()); input.value = ""; });\nconsole.log("ready");',
  };
  const tests = `
    test('reads top-level bindings', () => { expect(scope.price).toBe(45); expect(typeof scope.add).toBe('function'); });
    test('sees console output', () => { expect(logs()).toEqual(['ready']); });
    test('typing and submitting adds an item', async () => {
      await user.type(screen.byLabel('Назва'), 'Лампа');
      await user.click(screen.byRole('button', { name: 'Додати' }));
      expect(screen.$$('#list li')).toHaveLength(1);
      expect(screen.$('#list')).toHaveTextContent('Лампа');
      expect(screen.$('#name')).toHaveValue('');
    });
    test('fails with a readable message', () => { expect(scope.items).toHaveLength(5); });
    test('async assertions', async () => { await sleep(20); await expect(Promise.resolve(3)).resolves.toBe(3); });
    test('times out', async () => { await sleep(100000); });
  `;
  const r = await run({ entry: 'index.html', files, tests: { path: '__tests__.js', source: tests }, options: { testTimeoutMs: 400 } });
  assert.deepEqual(r.tests.map((t) => t.status), ['pass', 'pass', 'pass', 'fail', 'pass', 'fail']);
  assert.match(r.tests[3].message, /to have length 5 \(got 1\)/);
  assert.match(r.tests[5].message, /timed out/);
});

test('a form submitted without preventDefault is explained instead of reloading the sandbox', async () => {
  const r = await run({
    entry: 'index.html',
    files: { 'index.html': '<form id="f"><input name="q"><button>Go</button></form>' },
    tests: { path: '__tests__.js', source: 'test("submit", async () => { const result = await user.submit("#f"); expect(result.prevented).toBe(false); });' },
  });
  assert.deepEqual(r.tests.map((t) => t.status), ['pass']);
  assert.ok(systemCodes(r).includes('form-submit-navigation'));
});

test('TypeScript files run after type removal', async () => {
  const r = await run({ entry: 'index.ts', files: { 'index.ts': 'import { total } from "./sum.js";\ninterface Item { price: number }\nconst items: Item[] = [{ price: 2 }, { price: 3 }];\nconsole.log(total(items.map((i) => i.price)));', 'sum.ts': 'export const total = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);' } });
  assert.deepEqual(logs(r), ['5']);
});

test('React components render and respond to events (browser-react)', async () => {
  const r = await run({
    runtime: 'browser-react',
    entry: 'main.jsx',
    files: {
      'main.jsx': 'import { createRoot } from "react-dom/client";\nimport App from "./App";\ncreateRoot(document.getElementById("root")).render(<App />);',
      'App.jsx': 'import { useState } from "react";\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>Натиснуто: {count}</button>;\n}',
    },
    tests: { path: '__tests__.js', source: 'test("click updates state", async () => { const b = await waitFor(() => screen.byRole("button")); await user.click(b); await user.click(b); expect(b).toHaveTextContent("Натиснуто: 2"); });' },
  });
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors));
  assert.deepEqual(r.tests.map((t) => t.status), ['pass']);
});

test('React Native components render through the labeled web preview (concept-preview)', async () => {
  const r = await run({
    runtime: 'concept-preview',
    entry: 'main.jsx',
    files: {
      'main.jsx': 'import { createRoot } from "react-dom/client";\nimport { View, Text, Pressable } from "react-native";\nimport { useState } from "react";\nfunction App() { const [n, setN] = useState(0); return <View><Text accessibilityRole="header">Звички</Text><Pressable accessibilityRole="button" onPress={() => setN(n + 1)}><Text>Виконано: {n}</Text></Pressable></View>; }\ncreateRoot(document.getElementById("root")).render(<App />);',
    },
    tests: { path: '__tests__.js', source: 'test("press", async () => { const b = await waitFor(() => screen.byRole("button")); await user.click(b); expect(b).toHaveTextContent("Виконано: 1"); });' },
  });
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors));
  assert.deepEqual(r.tests.map((t) => t.status), ['pass']);
});
