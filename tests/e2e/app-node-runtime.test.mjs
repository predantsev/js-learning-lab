// V-07 / V-11 (UI part) / REQ-013, REQ-014, REQ-021–REQ-023, REQ-032, DEC-12: `isolated-node`
// lesson blocks run the learner's files as a real Node.js process through the local server, with
// the same learner experience as browser exercises — Run streams real output, Check runs tests.js
// through the Node harness with authored feedback and progress, Stop and the time limit end runaway
// code, busy / lost connection / unavailable states are explained and keep the code. The React
// Native concept-preview fixture block shows its limits. The content validator executes the Node
// fixtures and reports them UNVERIFIED when the executor is unavailable.
// Fixture lessons: tests/fixtures/content/units/NO-01/no-01-01-fixture-node, RN-01/rn-01-01-fixture-preview.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { detectNodeSupport } from '../../server/api/lib/node-runner.mjs';
import { FIXTURE_CONTENT, L1, Lab, ROOT, buildFixtureDist, editorText, launchChrome, openApp, replaceEditor, t, waitFor, waitSaved } from './helpers.mjs';

const NODE_LESSON = 'no-01-01-fixture-node';
const RN_LESSON = 'rn-01-01-fixture-preview';
let distDir;
let browser;
before(async () => {
  distDir = await buildFixtureDist();
  browser = await launchChrome();
});
after(async () => {
  await browser?.close();
  await fs.rm(distDir, { recursive: true, force: true });
});

const PROFILE = { language: 'uk', styleId: 'calm-studio', appearance: 'system', textSize: 'default', activeWorkspaceId: null, lastLesson: null, onboardingDone: true, createdAt: '2026-10-01T00:00:00.000Z' };
const actions = (page) => page.locator('.ws-actions');
const runButton = (page) => actions(page).getByRole('button', { name: t('uk', 'ws.run'), exact: true });
const checkButton = (page) => actions(page).getByRole('button', { name: t('uk', 'ws.check'), exact: true });
const stopButton = (page) => actions(page).getByRole('button', { name: t('uk', 'ws.stop'), exact: true });
const statusText = async (page) => (await page.locator('.ws-status').innerText()).trim();
const waitStatus = (page, text, timeout = 15_000) => waitFor(async () => (await statusText(page)) === text, { timeout, message: `status "${text}"` });
const consoleLines = (page) => page.locator('.console-line:not(.console-system)').evaluateAll((els) => els.map((e) => [...e.querySelectorAll('.console-arg')].map((a) => a.textContent).join(' ')));
const resultTabs = (page) => page.locator('.result-tabs [role="tab"]').evaluateAll((els) => els.map((e) => e.firstChild.textContent.trim()));
/** Bodies of the POST /api/node/run requests the page sends. */
function recordRunRequests(page) {
  const bodies = [];
  page.on('request', (request) => { if (request.url().endsWith('/api/node/run')) bodies.push(request.postDataJSON()); });
  return bodies;
}

async function openNode(lab, pageNo, { hash = `#/lesson/${NODE_LESSON}/${pageNo}` } = {}) {
  await lab.seed('profile', PROFILE);
  const session = await openApp(browser, lab, { hash });
  await session.page.locator(`#block-${pageNo === 1 ? 'node-notes' : 'node-items-server'}`).waitFor();
  return session;
}

const NOTES = (secondNote) => `// Writes a file in the exercise folder, reads it back and prints what only Node.js can tell.
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'notes.txt');
fs.writeFileSync(file, 'Купити лампу\\n');
fs.appendFileSync(file, '${secondNote}\\n');

const lines = fs.readFileSync(file, 'utf8').trim().split('\\n');
console.log(\`Node.js \${process.version}\`);
console.log(\`Збережено у файлі: \${path.basename(file)} (\${lines.length})\`);
for (const line of lines) console.log(\`- \${line}\`);
`;

test('a Node example runs in real Node: its version and a file written and read back in the exercise folder; an edit changes the output', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openNode(lab, 1);
    const bodies = recordRunRequests(page);
    // Honest label: the runtime, the real engine version, no page preview, no browser storage tab.
    assert.equal((await page.locator('.ws-editor .runtime-chip').innerText()).trim(), 'isolated-node');
    assert.equal((await page.locator('.ws-editor .runtime-note').innerText()).trim(), `${t('uk', 'ws.runtime.isolated-node')} · ${t('uk', 'ws.node.engine', { version: process.version })}`);
    assert.deepEqual(await resultTabs(page), [t('uk', 'ws.console')]);
    // The limits disclosure: the block's time limit (capabilities.timeoutMs) and the machine's facts.
    await page.locator('.node-limits > summary').click();
    const limits = await page.locator('.node-limits').innerText();
    assert.match(limits, new RegExp(t('uk', 'ws.node.limit.time', { s: 5 }).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.ok(limits.includes(t('uk', 'ws.node.limit.networkNone')));
    assert.ok(limits.includes(t('uk', 'ws.node.limit.honesty')));
    await page.locator('.node-limitations summary').click();
    assert.ok((await page.locator('.node-limitations li').count()) >= 3, 'the server-measured limitations are listed');

    await runButton(page).click();
    await waitStatus(page, t('uk', 'ws.finished'));
    assert.deepEqual(await consoleLines(page), [`Node.js ${process.version}`, 'Збережено у файлі: notes.txt (2)', '- Купити лампу', '- Полити квіти']);
    const [first] = bodies;
    assert.deepEqual([first.mode, first.entry, first.timeoutMs, first.capabilities], ['run', 'index.js', 5000, { network: 'none', workers: false }]);
    assert.match(first.files['index.js'], /Купити лампу/, 'the example text follows the lesson language');

    await replaceEditor(page, NOTES('Нагодувати кота'));
    await runButton(page).click();
    await waitFor(async () => (await consoleLines(page)).includes('- Нагодувати кота'), { message: 'edited output' });
    assert.ok(!(await consoleLines(page)).includes('- Полити квіти'), 'a fresh run: the old output is gone');
    await waitSaved(page);
    assert.match((await lab.doc(`drafts/${NODE_LESSON}`)).blocks['node-notes'].files['index.js'], /Нагодувати кота/);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('reading a file outside the exercise folder is denied, with localized guidance next to the verbatim diagnostic', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openNode(lab, 1);
    const code = "import fs from 'node:fs';\nconsole.log('before');\nconsole.log(fs.readFileSync('/etc/hosts', 'utf8'));\n";
    await replaceEditor(page, code);
    await runButton(page).click();
    await waitStatus(page, t('uk', 'ws.finishedErrors'));
    const card = page.locator('.console-wrap .error-card');
    assert.equal(await card.count(), 1);
    assert.match(await card.locator('.error-card-title').innerText(), new RegExp(t('uk', 'ws.atLine', { file: 'index.js', line: 3 })));
    assert.equal((await card.locator('.error-guide').innerText()).trim(), t('uk', 'err.guide.node.access'));
    const original = await card.locator('.error-original pre').innerText();
    assert.match(original, /^Error: Access to this API has been restricted/);
    assert.match(original, /code: 'ERR_ACCESS_DENIED'/);
    assert.match(original, /resource: '\/etc\/hosts'/);
    const lines = await consoleLines(page);
    assert.equal(lines[0], 'before');
    assert.ok(!lines.some((l) => /localhost/.test(l)), 'nothing of /etc/hosts was printed');
    assert.ok(lines.some((l) => /^\s+at index\.js:3:\d+$/.test(l)), 'stack paths are shown relative to the exercise');
    assert.equal(await editorText(page), code, 'the code is untouched');
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('an infinite loop ends at the time limit with a localized explanation; Stop ends a run at once; the next run works', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openNode(lab, 1);
    const loop = "console.log('start');\nfor (;;) {}\n";
    await replaceEditor(page, loop);
    const started = Date.now();
    await runButton(page).click();
    await waitStatus(page, t('uk', 'ws.running'), 5000);
    await page.locator('.ws-status.ws-status-auto-stopped').waitFor({ timeout: 15_000 });
    assert.equal(await statusText(page), t('uk', 'ws.node.timeout', { s: 5 }));
    assert.ok(Date.now() - started >= 4500, 'the declared 5 s limit applied');
    assert.deepEqual(await consoleLines(page), ['start'], 'output printed before the loop reached the console');
    assert.equal(await editorText(page), loop);
    await stopButton(page).waitFor({ state: 'detached' });

    await runButton(page).click();
    await waitFor(async () => (await consoleLines(page)).includes('start'), { message: 'second run started' });
    const stopAt = Date.now();
    await stopButton(page).click();
    await waitStatus(page, t('uk', 'ws.stopped'), 3000);
    await stopButton(page).waitFor({ state: 'detached', timeout: 3000 });
    assert.ok(Date.now() - stopAt < 2000, 'Stop ends the process at once');
    assert.equal(await waitFor(() => lab.server.api.nodeRunner.runs.size === 0 || null, { message: 'no Node run left on the server' }), true);

    await replaceEditor(page, "console.log('again', typeof process.pid);\n");
    await runButton(page).click();
    await waitStatus(page, t('uk', 'ws.finished'));
    assert.deepEqual(await consoleLines(page), ['again number']);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('an output flood is cut at the output limit with a localized explanation; the console keeps the latest lines', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openNode(lab, 1);
    const flood = "let i = 0;\nfor (;;) console.log(`line ${i++} ${'x'.repeat(60)}`);\n";
    await replaceEditor(page, flood);
    await runButton(page).click();
    await page.locator('.ws-status.ws-status-auto-stopped').waitFor({ timeout: 15_000 });
    assert.equal(await statusText(page), t('uk', 'ws.node.outputLimit', { kb: 200 }));
    const lines = await consoleLines(page);
    assert.ok(lines.length > 100 && lines.length <= 1000, `the console holds the latest lines, at most 1000 (${lines.length})`);
    assert.match(lines.at(-2), /^line \d+ x{60}$/, 'real output up to the cut');
    assert.equal(await editorText(page), flood);
    await replaceEditor(page, "console.log('calm again');\n");
    await runButton(page).click();
    await waitStatus(page, t('uk', 'ws.finished'));
    assert.deepEqual(await consoleLines(page), ['calm again']);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

const SOLUTION = `import http from 'node:http';
import { items } from './items.js';

export function createApp() {
  return http.createServer((request, response) => {
    if (request.url === '/items') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(items));
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'not found' }));
  });
}
`;
const EVERY_ADDRESS_200 = `import http from 'node:http';
import { items } from './items.js';

export function createApp() {
  return http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(items));
  });
}
`;

test('Check runs tests.js through the Node harness: failing checks show their authored feedback, a passing solution records progress', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openNode(lab, 2);
    const bodies = recordRunRequests(page);
    assert.deepEqual(await resultTabs(page), [t('uk', 'ws.console'), t('uk', 'ws.tests')]);
    // The starter answers "TODO" everywhere: all three checks fail, each with its authored feedback.
    await checkButton(page).click();
    await page.locator('.tests-summary').waitFor({ timeout: 20_000 });
    assert.equal((await page.locator('.tests-summary').innerText()).trim(), t('uk', 'ws.passedSome', { passed: 0, total: 3 }));
    assert.deepEqual(await page.locator('.test-title').allInnerTexts(), ['GET /items відповідає 200 і списком у JSON', 'Відповідь позначена як JSON (content-type)', 'Невідома адреса відповідає 404']);
    assert.equal(await page.locator('.test-list .test-feedback').count(), 3);
    assert.equal(await page.locator('.ws-load-error').count(), 0);
    const check = bodies.at(-1);
    assert.deepEqual([check.mode, check.entry, check.tests.path, check.capabilities, check.strings], ['test', 'index.js', '__tests__.js', { network: 'loopback', workers: false }, { lamp: 'Настільна лампа', plant: 'Кімнатна рослина' }]);

    // A realistic mistake: every address gets the list. Only the 404 check fails, with its feedback.
    await replaceEditor(page, EVERY_ADDRESS_200);
    await checkButton(page).click();
    await waitFor(async () => (await page.locator('.tests-summary').innerText()).trim() === t('uk', 'ws.passedSome', { passed: 2, total: 3 }), { timeout: 20_000, message: '2 of 3' });
    const failed = page.locator('.test.test-fail');
    assert.equal(await failed.count(), 1);
    assert.match(await failed.locator('.test-message').innerText(), /status of GET \/missing: expected 200 to be 404/);
    assert.match(await failed.locator('.test-feedback').innerText(), /Адреса, відмінна від \/items, має отримати статус 404/);

    await replaceEditor(page, SOLUTION);
    await checkButton(page).click();
    await page.locator('.tests-summary.tests-ok').waitFor({ timeout: 20_000 });
    assert.match(await statusText(page), new RegExp(t('uk', 'ws.exercisePassed')));
    const progress = await waitFor(async () => (await lab.doc('progress'))?.lessons?.[NODE_LESSON]?.exercises?.['node-items-server']?.passedAt ?? null, { message: 'progress recorded' });
    assert.ok(progress);

    // Run: the read-only entry starts the learner's server and sends it two real requests.
    await runButton(page).click();
    await waitStatus(page, t('uk', 'ws.finished'), 20_000);
    assert.deepEqual(await consoleLines(page), ['GET /items → 200 [{"id":1,"name":"Настільна лампа"},{"id":2,"name":"Кімнатна рослина"}]', 'GET /missing → 404 {"error":"not found"}']);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('a program that throws while loading: one error card and one line instead of misleading per-check feedback (browser and Node)', async () => {
  const lab = await Lab.start({ distDir });
  try {
    // Browser runtime: a typo throws before anything is printed, so both checks fail.
    await lab.seed('profile', PROFILE);
    const { page, problems, context } = await openApp(browser, lab, { hash: `#/lesson/${L1}/2` });
    await page.locator('#block-basics-exercise').waitFor();
    await replaceEditor(page, "import { label } from './label.js';\n\nconsole.log(lable, 3);\n");
    await checkButton(page).click();
    await page.locator('.tests-summary').waitFor({ timeout: 15_000 });
    assert.equal(await page.locator('.test').count(), 2, 'the check rows stay listed');
    assert.equal(await page.locator('.test.test-fail').count(), 2);
    assert.equal(await page.locator('.test-list .test-feedback').count(), 0, 'no per-check feedback');
    assert.equal((await page.locator('.ws-load-error').innerText()).trim(), t('uk', 'ws.loadErrorFirst'));
    const card = page.locator('.error-card');
    assert.equal(await card.count(), 1);
    assert.match(await card.locator('.error-original pre').innerText(), /^ReferenceError: lable is not defined/);

    // Node runtime: the handler throws while the entry's own requests run (before the checks), and
    // the checks that ask for /items fail too; the first error is shown once, with the same line,
    // and no per-check feedback.
    await page.goto(lab.url(`#/lesson/${NODE_LESSON}/2`));
    await page.locator('#block-node-items-server').waitFor();
    await replaceEditor(page, SOLUTION.replace('JSON.stringify(items)', 'JSON.stringify(item)'));
    await checkButton(page).click();
    await page.locator('.tests-summary').waitFor({ timeout: 20_000 });
    assert.equal(await page.locator('.test').count(), 3, 'the check rows stay listed');
    assert.equal(await page.locator('.test.test-fail').count(), 2);
    assert.match(await page.locator('.test.test-fail .test-message').first().innerText(), /uncaught error during the test: ReferenceError: item is not defined/);
    assert.equal(await page.locator('.test-list .test-feedback').count(), 0, 'no per-check feedback');
    assert.equal((await page.locator('.ws-load-error').innerText()).trim(), t('uk', 'ws.loadErrorFirst'));
    const nodeCard = page.locator('.error-card');
    assert.equal(await nodeCard.count(), 1);
    assert.match(await nodeCard.locator('.error-original pre').innerText(), /^ReferenceError: item is not defined/);
    assert.match(await nodeCard.locator('.error-card-title').innerText(), new RegExp(t('uk', 'ws.atLine', { file: 'app.js', line: 8 })));
    // The learner's uncaught ReferenceError inside the sandbox frame is the scenario, not an app error.
    assert.deepEqual(problems.filter((p) => p !== 'pageerror: lable is not defined'), []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('a Node prediction: "Run and check" runs its code in real Node.js and shows the real order', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openNode(lab, 1);
    const block = page.locator('#block-node-order');
    await block.waitFor();
    await block.getByRole('button', { name: t('uk', 'q.submit') }).click();
    await block.getByRole('button', { name: t('uk', 'q.run') }).click();
    const output = block.locator('.real-output pre');
    await output.waitFor({ timeout: 20_000 });
    assert.equal(await output.innerText(), 'sync\npromise\nnextTick\ntimeout');
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('checks that cannot start show the error with its authored feedback, once (Node)', async () => {
  const lab = await Lab.start({ distDir });
  try {
    // A draft in which the read-only entry does not import app.js (as in a driver that only prints):
    // the checks' own import of app.js is the first place the learner's ReferenceError appears.
    const broken = "export function createApp() { return null; }\nmissingName;\n";
    await lab.seed(`drafts/${NODE_LESSON}`, { blocks: { 'node-items-server': { files: { 'index.js': "console.log('driver');\n", 'app.js': broken, 'items.js': "export const items = [];\n" }, lang: 'uk', updatedAt: PROFILE.createdAt } } });
    const { page, problems, context } = await openNode(lab, 2);
    await checkButton(page).click();
    await page.locator('.ws-result .ws-note').filter({ hasText: t('uk', 'ws.harnessError') }).waitFor({ timeout: 20_000 });
    const cards = page.locator('.ws-result .error-card');
    assert.equal(await cards.count(), 1);
    assert.match(await cards.locator('.error-original pre').innerText(), /^ReferenceError: missingName is not defined/);
    assert.match(await cards.locator('.test-feedback').innerText(), /Програма звертається до назви, якої немає/);

    // The real entry imports app.js too: the same error is the program's load error first. One card
    // (with the feedback), not a second copy from the checks.
    assert.deepEqual(problems, []);
    await context.close();
    await lab.seed(`drafts/${NODE_LESSON}`, { blocks: {} });
    const second = await openNode(lab, 2);
    await replaceEditor(second.page, broken);
    await checkButton(second.page).click();
    // Nothing was checked, so the workspace shows the console with the error; the checks tab has it too.
    await second.page.locator('.ws-result .console-wrap .error-card').waitFor({ timeout: 20_000 });
    await second.page.locator('.result-tabs [role="tab"]', { hasText: t('uk', 'ws.tests') }).click();
    await second.page.locator('.ws-result .ws-note').filter({ hasText: t('uk', 'ws.harnessError') }).waitFor();
    assert.equal(await second.page.locator('.ws-result .error-card').count(), 1, 'one card for one error');
    assert.equal(await second.page.locator('.ws-result .error-card .test-feedback').count(), 1);
    assert.deepEqual(second.problems, []);
    await second.context.close();
  } finally {
    await lab.dispose();
  }
});

test('busy: when two Node runs are already active, Run explains it and keeps the code; afterwards runs work', async () => {
  const lab = await Lab.start({ distDir });
  const holders = [];
  try {
    const { page, problems, context } = await openNode(lab, 1);
    // Two runs started elsewhere (as by two other tabs), kept open.
    for (let i = 0; i < 2; i += 1) {
      const controller = new AbortController();
      const response = await fetch(`http://localhost:${lab.port}/api/node/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-jsll-token': lab.server.store.meta.token },
        body: JSON.stringify({ files: { 'hold.js': 'setInterval(() => {}, 1000);' }, entry: 'hold.js', timeoutMs: 30_000 }),
        signal: controller.signal,
      });
      assert.equal(response.status, 200);
      holders.push(controller);
    }
    const before = await editorText(page);
    await runButton(page).click();
    await waitStatus(page, t('uk', 'ws.node.busy'));
    assert.equal(await page.locator('.ws-status.ws-status-failed').count(), 1);
    assert.equal(await editorText(page), before);
    for (const controller of holders) controller.abort();
    await waitFor(() => lab.server.api.nodeRunner.runs.size === 0 || null, { message: 'held runs ended' });
    await runButton(page).click();
    await waitStatus(page, t('uk', 'ws.finished'));
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    for (const controller of holders) controller.abort();
    await lab.dispose();
  }
});

test('a lost connection to the server is explained, the code is kept, and the next run works once the server is back', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openNode(lab, 1);
    const code = "console.log('tick');\nsetInterval(() => console.log('tick'), 300);\n";
    await replaceEditor(page, code);
    await waitSaved(page);
    await runButton(page).click();
    await waitFor(async () => (await consoleLines(page)).includes('tick'), { message: 'run started' });
    await lab.restart(); // closes every connection, including the open run stream
    await waitStatus(page, t('uk', 'ws.node.disconnected'));
    assert.equal(await editorText(page), code);
    assert.equal(await stopButton(page).count(), 0);
    await replaceEditor(page, "console.log('back');\n");
    await runButton(page).click();
    await waitStatus(page, t('uk', 'ws.finished'));
    assert.deepEqual(await consoleLines(page), ['back']);
    // The broken stream is the scenario itself, and a document save that was in flight
    // while the server restarted fails for the same reason; nothing else may fail.
    assert.deepEqual(problems.filter((p) => !/^requestfailed: .*\/api\/(node\/run|store\/doc\?id=\w+)$/.test(p)), []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('without proven isolation the block says why, Run and Check stay disabled and drafts are kept and saved', async () => {
  // The real "no permission model" path of the server's availability probe.
  const lab = await Lab.start({ distDir, overrides: { nodeRunner: { support: { ...detectNodeSupport(), permissionFlag: null } } } });
  try {
    const reason = lab.server.api.features.isolatedNode.reason;
    assert.match(reason, /has no permission model/);
    const draft = "console.log('my own draft');\n";
    await lab.seed(`drafts/${NODE_LESSON}`, { blocks: { 'node-notes': { files: { 'index.js': draft }, lang: 'uk', updatedAt: '2026-10-01T00:00:00.000Z' } } });
    const { page, problems, context } = await openNode(lab, 1);
    const bodies = recordRunRequests(page);
    assert.equal((await page.locator('.node-unavailable').innerText()).trim(), t('uk', 'ws.nodeUnavailable', { reason }));
    assert.equal(await runButton(page).getAttribute('aria-disabled'), 'true');
    assert.equal(await editorText(page), draft, 'the saved draft is shown');
    await runButton(page).click({ force: true }); // aria-disabled: a click must do nothing
    await new Promise((r) => setTimeout(r, 300));
    assert.equal(bodies.length, 0, 'nothing is sent to the executor');
    assert.equal(await statusText(page), t('uk', 'ws.idle'));
    await replaceEditor(page, "console.log('still editable');\n");
    await waitSaved(page);
    assert.equal((await lab.doc(`drafts/${NODE_LESSON}`)).blocks['node-notes'].files['index.js'], "console.log('still editable');\n");
    await page.goto(lab.url(`#/lesson/${NODE_LESSON}/2`));
    await page.locator('#block-node-items-server').waitFor();
    assert.equal(await checkButton(page).getAttribute('aria-disabled'), 'true');
    // Settings → How code runs says the same.
    await page.goto(lab.url('#/settings'));
    await page.locator('.node-settings').waitFor();
    assert.ok((await page.locator('.node-settings').innerText()).includes(t('uk', 'ws.nodeUnavailable', { reason })));
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('the React Native concept-preview block is labeled, shows its limits and runs in the preview', async () => {
  const lab = await Lab.start({ distDir });
  try {
    await lab.seed('profile', PROFILE);
    const { page, problems, context } = await openApp(browser, lab, { hash: `#/lesson/${RN_LESSON}/1` });
    await page.locator('#block-rn-card').waitFor();
    assert.equal((await page.locator('.ws-editor .runtime-chip').innerText()).trim(), 'concept-preview');
    assert.equal((await page.locator('.ws-editor .runtime-note').innerText()).trim(), t('uk', 'ws.runtime.concept-preview'));
    const limits = page.locator('.ws-editor details.limits');
    assert.equal((await limits.locator('summary').innerText()).trim(), t('uk', 'ws.limits'));
    await limits.locator('summary').click();
    assert.match(await limits.innerText(), /Це перегляд у браузері через react-native-web, а не native-застосунок/);
    await runButton(page).click();
    await page.locator('.ws-status.ws-status-done').waitFor({ timeout: 15_000 });
    const frame = await (await page.locator('.frame-host iframe.runner-frame').elementHandle()).contentFrame();
    await frame.getByRole('heading', { name: 'Ранкова пробіжка' }).waitFor();
    // Headless Chrome can drop the first pointer event aimed at a cross-site frame created a moment
    // ago (see app-lesson-content.test.mjs): click once :hover shows that input reaches the frame.
    const button = frame.getByRole('button', { name: 'Подобається: 0' });
    await waitFor(async () => { await button.hover(); return button.evaluate((el) => el.matches(':hover')); }, { message: 'pointer input reaches the preview' });
    await button.click();
    await frame.getByRole('button', { name: 'Подобається: 1' }).waitFor();
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

/** Run the content validator on the fixture root; resolve { code, output }. */
function validate(args, env = {}) {
  const child = spawn(process.execPath, ['scripts/content/validate.mjs', ...args], { cwd: ROOT, env: { ...process.env, JSLL_CONTENT_ROOT: FIXTURE_CONTENT, ...env } });
  let output = '';
  child.stdout.on('data', (d) => { output += d; });
  child.stderr.on('data', (d) => { output += d; });
  return new Promise((resolve) => child.on('close', (code) => resolve({ code, output })));
}

test('the content validator executes the Node fixtures for real, and reports them UNVERIFIED (an error with --release) when the executor is unavailable', async () => {
  const real = await validate(['--lesson', NODE_LESSON]);
  assert.equal(real.code, 0, real.output);
  // example ×2 languages + (starter, solution, alt, wrong, wrong-no-type) ×2 languages + the Node prediction
  assert.match(real.output, /CONTENT VALID: 1 lesson\(s\), 0 example run\(s\), 0 exercise fixture run\(s\), 1 verified prediction\(s\), 13 isolated-node run\(s\),/);

  const off = await validate(['--lesson', NODE_LESSON], { JSLL_NODE_RUNNER: 'off' });
  assert.equal(off.code, 0, off.output);
  assert.match(off.output, /CONTENT UNVERIFIED: .*0 isolated-node run\(s\) \(3 isolated-node block\(s\) UNVERIFIED: executor unavailable\)/);
  assert.match(off.output, /· no-01-01-fixture-node › node-order — UNVERIFIED/);
  assert.match(off.output, /· no-01-01-fixture-node › node-notes — UNVERIFIED: the isolated Node executor is not available/);
  assert.doesNotMatch(off.output, /CONTENT VALID/);

  const release = await validate(['--lesson', NODE_LESSON, '--release'], { JSLL_NODE_RUNNER: 'off' });
  assert.equal(release.code, 1);
  assert.match(release.output, /✖ no-01-01-fixture-node › node-items-server — UNVERIFIED: the isolated Node executor is not available/);
});
