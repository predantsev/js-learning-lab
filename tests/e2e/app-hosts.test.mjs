// REQ-021 / REQ-030: the application also works at its fallback address http://localhost:<port>.
// The runner keeps the sandbox on a different site from the application, including in browsers that
// cannot load *.localhost subdomains (simulated here), where it falls back to 127.0.0.1.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, Lab, buildFixtureDist, launchChrome, replaceEditor, t, waitFor } from './helpers.mjs';

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
const PROBE = [
  'console.log("probe");',
  'try { console.log("parent:" + parent.document.title); } catch (e) { console.log("parent-denied:" + e.name); }',
  'try { await fetch("/api/bootstrap"); console.log("api-reached"); } catch (e) { console.log("api-denied:" + e.name); }',
  'console.log("origin:" + self.origin);',
].join('\n');

/** Open the app at http://localhost:<port> (the documented fallback address), not js-learning-lab.localhost. */
async function openAtFallbackHost(lab, context, hash) {
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => { if (!/jsll-run-|127\.0\.0\.1|\/sandbox\//.test(e.stack ?? '')) problems.push(e.message); });
  await page.goto(`http://localhost:${lab.port}/${hash}`);
  await page.locator('.app').waitFor();
  return { page, problems };
}
const consoleText = (page) => page.locator('.console').innerText();
const runFrameHost = (page) => page.locator('.frame-host iframe.runner-frame').evaluate((f) => new URL(f.src).host);

async function runProbe(page) {
  await page.locator('#block-basics-example').waitFor();
  await replaceEditor(page, PROBE);
  const started = Date.now();
  await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.run'), exact: true }).click();
  await page.locator('.ws-status.ws-status-done').waitFor({ timeout: 15_000 });
  await waitFor(async () => /origin:/.test(await consoleText(page)), { message: 'probe output' });
  return Date.now() - started;
}

test('at http://localhost:<port> the runner works and the sandbox is another site', async () => {
  const lab = await Lab.start({ distDir });
  try {
    await lab.seed('profile', PROFILE);
    const context = await browser.newContext();
    const { page, problems } = await openAtFallbackHost(lab, context, `#/lesson/${L1}/1`);
    assert.equal(await page.evaluate(() => location.host), `localhost:${lab.port}`);
    await runProbe(page);
    const host = await runFrameHost(page);
    assert.match(host, /^jsll-run-\d+\.localhost:\d+$/, 'a *.localhost sandbox host: a different site from localhost');
    const text = await consoleText(page);
    assert.match(text, /parent-denied:SecurityError/, 'learner code cannot reach the application page');
    assert.match(text, /api-denied:TypeError/, 'nor the local API');
    assert.match(text, /origin:null/, 'the sandbox document has an opaque origin');
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('when this browser cannot load *.localhost sandbox hosts, runs fall back to 127.0.0.1 and stay isolated', async () => {
  const lab = await Lab.start({ distDir });
  try {
    await lab.seed('profile', PROFILE);
    const context = await browser.newContext();
    // Simulate a browser (an embedded pane) that cannot resolve *.localhost subdomains.
    let blocked = 0;
    await context.route(/^http:\/\/jsll-run-\d+\.localhost:\d+\//, (route) => { blocked += 1; return route.abort('namenotresolved'); });
    const { page, problems } = await openAtFallbackHost(lab, context, `#/lesson/${L1}/1`);
    const firstRun = await runProbe(page);
    assert.ok(blocked >= 1, 'the first attempt used a *.localhost sandbox host');
    assert.ok(firstRun < 8000, `the fallback is found quickly, not after the 8 s start timeout (${firstRun} ms)`);
    assert.equal(await runFrameHost(page), `127.0.0.1:${lab.port}`);
    const text = await consoleText(page);
    assert.match(text, /probe/);
    assert.match(text, /parent-denied:SecurityError/, 'still isolated from the application page');
    assert.match(text, /api-denied:TypeError/, 'still no access to the local API');
    assert.match(text, /origin:null/);
    assert.equal((await page.locator('.ws-status').innerText()).trim(), t('uk', 'ws.finished'));

    // Later runs go straight to the IP host.
    const blockedBefore = blocked;
    const second = await runProbe(page);
    assert.equal(blocked, blockedBefore, 'no second attempt on the unreachable host');
    assert.ok(second < 4000, `second run is direct (${second} ms)`);

    // The prediction's "Run and check" uses the same sandbox host.
    await page.locator('.pager').getByRole('button', { name: t('uk', 'lesson.next') }).click();
    const predict = page.locator('#block-basics-predict');
    await predict.locator('input[type=radio]').first().check();
    await predict.getByRole('button', { name: t('uk', 'q.submit') }).click();
    await predict.getByRole('button', { name: new RegExp(t('uk', 'q.run')) }).click();
    await predict.locator('.real-output pre').filter({ hasText: '2 + 2' }).waitFor({ timeout: 15_000 });
    assert.equal(await predict.locator('.real-output pre').innerText(), '4\n2 + 2');
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});
