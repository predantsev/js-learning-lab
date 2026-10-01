// V-11 (UI part) / REQ-022: an infinite loop typed in the editor is stopped by the loop budget with a
// localized explanation next to the verbatim diagnostic; a runaway that defeats the loop guard is
// stopped with the Stop button (or by the declared automatic stop); the platform stays responsive,
// the editor and saved work survive, and the next run uses a fresh sandbox.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, Lab, buildFixtureDist, editorText, launchChrome, openApp, replaceEditor, t, waitFor, waitSaved } from './helpers.mjs';

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
const status = (page) => page.locator('.ws-status');
const runButton = (page, lang = 'uk') => page.locator('.ws-actions').getByRole('button', { name: t(lang, 'ws.run'), exact: true });
const stopButton = (page) => page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.stop'), exact: true });

async function open(lab) {
  await lab.seed('profile', PROFILE);
  const session = await openApp(browser, lab, { hash: `#/lesson/${L1}/1` });
  await session.page.locator('#block-basics-example').waitFor();
  return session;
}

test('an infinite loop is stopped by the loop budget with localized guidance and the verbatim diagnostic', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await open(lab);
    const code = 'console.log("start");\nlet i = 0;\nwhile (true) {\n  i++;\n}\n';
    await replaceEditor(page, code);
    await runButton(page).click();
    const card = page.locator('.error-card');
    await card.waitFor({ timeout: 10_000 });
    assert.equal((await status(page).innerText()).trim(), t('uk', 'ws.finishedErrors'));
    assert.match(await card.innerText(), new RegExp(t('uk', 'ws.runtimeError')));
    assert.match(await card.innerText(), new RegExp(t('uk', 'ws.atLine', { file: 'index.js', line: 3 })));
    assert.equal((await card.locator('.error-guide').innerText()).trim(), t('uk', 'err.guide.LoopBudgetError', { ms: 2000 }));
    const original = card.locator('.error-original pre');
    assert.equal(await original.getAttribute('lang'), 'en', 'the raw diagnostic is marked as English');
    assert.match(await original.innerText(), /^LoopBudgetError: Loop on line 3 ran longer than 2000 ms \(possible infinite loop\)\.$/);
    assert.match(await page.locator('.console').innerText(), /start/);
    assert.equal(await card.getAttribute('role'), 'alert');
    assert.equal(await editorText(page), code, 'the code is untouched');

    // The same diagnostic in English: guidance localized, original text verbatim.
    await page.locator('.lang-switch').getByRole('button', { name: 'EN', exact: true }).click();
    await runButton(page, 'en').click();
    await page.locator('.error-card .error-guide').filter({ hasText: t('en', 'err.guide.LoopBudgetError', { ms: 2000 }) }).waitFor({ timeout: 10_000 });
    assert.match(await page.locator('.error-card .error-original pre').innerText(), /^LoopBudgetError: Loop on line 3 ran longer than 2000 ms/);
    await waitSaved(page);
    assert.equal((await lab.doc(`drafts/${L1}`)).blocks['basics-example'].files['index.js'], code);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('a runaway that defeats the loop guard: the page stays responsive, Stop works, code survives, the next run is fresh', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await open(lab);
    // Code built at run time is not instrumented, so only the controller can stop it. (The hang
    // starts in a later task: output printed in the same task as a hang cannot leave the stuck
    // frame — Chrome delivers its messages only when the task yields; see the evidence notes.)
    const runaway = 'console.log("before");\nsetTimeout(() => eval("for (;;) {}"), 100);\n';
    await replaceEditor(page, runaway);
    await waitSaved(page);
    await page.evaluate(() => { window.__ticks = 0; window.__timer = setInterval(() => { window.__ticks += 1; }, 50); });
    await runButton(page).click();
    await page.locator('.ws-status.ws-status-warn').waitFor({ timeout: 10_000 });
    assert.equal((await status(page).innerText()).trim(), t('uk', 'ws.unresponsive', { s: 3 }));
    const ticks = await page.evaluate(() => window.__ticks);
    assert.ok(ticks >= 30, `the platform page kept running while the sandbox was stuck (${ticks} timer ticks)`);
    assert.equal(await runButton(page).getAttribute('aria-disabled'), null, 'Run stays available while the sandbox is stuck');

    const stopAt = Date.now();
    await stopButton(page).click();
    await waitFor(async () => (await status(page).innerText()).trim() === t('uk', 'ws.stopped'), { message: 'stopped status', timeout: 3000 });
    assert.ok(Date.now() - stopAt < 2000, 'Stop responds immediately');
    assert.equal(await stopButton(page).count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), t('uk', 'ws.run'), 'focus moves to Run after Stop');
    assert.equal(await editorText(page), runaway, 'the editor keeps the code');
    assert.equal((await lab.doc(`drafts/${L1}`)).blocks['basics-example'].files['index.js'], runaway, 'saved work is intact');
    assert.match(await page.locator('.console').innerText(), /before/);

    await replaceEditor(page, 'console.log("fresh context", typeof window.__leftover);\nwindow.__leftover = 1;\n');
    await runButton(page).click();
    const line = page.locator('.console-line').filter({ hasText: 'fresh context' });
    await line.waitFor({ timeout: 10_000 });
    assert.deepEqual(await line.locator('.console-arg').allInnerTexts(), ['fresh context', 'undefined'], 'a fresh sandbox: nothing left over from the stopped run');
    await waitFor(async () => (await status(page).innerText()).trim() === t('uk', 'ws.finished'), { message: 'finished status' });
    await page.evaluate(() => clearInterval(window.__timer));
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('an unresponsive run that nobody stops is stopped automatically and explained', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await open(lab);
    const runaway = 'new Function("while (true) {}")();\n';
    await replaceEditor(page, runaway);
    await runButton(page).click();
    await page.locator('.ws-status.ws-status-warn').waitFor({ timeout: 10_000 });
    await page.locator('.ws-status.ws-status-auto-stopped').waitFor({ timeout: 15_000 });
    assert.equal((await status(page).innerText()).trim(), t('uk', 'ws.autoStopped', { s: 8 }));
    assert.equal(await editorText(page), runaway);
    await replaceEditor(page, 'console.log("again");\n');
    await runButton(page).click();
    await page.locator('.console').getByText('again').waitFor({ timeout: 10_000 });
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});
