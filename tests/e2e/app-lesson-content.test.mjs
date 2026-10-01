// Lesson content features reported by the first lesson author: project SVG images (in HTML, CSS
// and from JavaScript) and honest notes for failed resources; links between project pages;
// authored feedback for syntax errors; inline check titles; the validator accepting syntax-error
// predictions; code-trace panels hidden when empty in every step.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { FIXTURE_CONTENT, Lab, ROOT, buildFixtureDist, launchChrome, openApp, replaceEditor, t, waitFor } from './helpers.mjs';

const L3 = 'js-02-01-fixture-pages';
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
const runButton = (page) => page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.run'), exact: true });
const checkButton = (page) => page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.check'), exact: true });
/** The visible run frame (cross-site sandbox), for looking inside the learner's page. */
const runFrame = async (page) => {
  const handle = await page.locator('.frame-host iframe.runner-frame').elementHandle();
  return handle.contentFrame();
};
/**
 * Click inside the run frame once pointer input demonstrably reaches it. Headless Chrome can drop
 * the very first mouse event aimed at a cross-site frame created a moment ago (observed: the link
 * was in view, the first trusted click was lost, a second one worked), so wait for :hover first.
 */
async function clickInFrame(frame, selector) {
  const target = frame.locator(selector);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await target.hover();
    if (await target.evaluate((el) => el.matches(':hover'))) return target.click();
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`pointer input never reached ${selector} in the run frame`);
}
const consoleLines = (page) => page.locator('.console-line:not(.console-system)').evaluateAll((els) => els.map((e) => [...e.querySelectorAll('.console-arg')].map((a) => a.textContent).join(' ')));
const systemNotes = (page) => page.locator('.console-system').allTextContents();

async function openLesson(lab, pageNo) {
  await lab.seed('profile', PROFILE);
  const session = await openApp(browser, lab, { hash: `#/lesson/${L3}/${pageNo}` });
  await session.page.locator('#lesson-title').waitFor();
  return session;
}

test('project SVG images show in HTML, CSS and from JavaScript; failed resources are explained honestly', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openLesson(lab, 1);
    await page.locator('#block-pages-site').waitFor();
    await runButton(page).click();
    await page.locator('.ws-status.ws-status-done').waitFor({ timeout: 15_000 });
    const frame = await runFrame(page);
    await frame.waitForFunction(() => document.readyState === 'complete');
    // The learner's markup is kept: a src that matches no project file stays as written.
    assert.equal(await frame.evaluate(() => document.getElementById('missing').getAttribute('src')), 'img/missing.svg');
    assert.equal(await frame.evaluate(() => document.getElementById('missing').alt), 'Зображення, якого немає');
    await page.getByRole('tab', { name: t('uk', 'ws.console') }).click();
    await waitFor(async () => (await consoleLines(page)).some((l) => l.startsWith('css backgrounds')), { message: 'the page reported its images' });
    const lines = await consoleLines(page);
    assert.ok(lines.includes('logo loaded'), `project SVG in <img> loads (${lines})`);
    assert.ok(lines.includes('missing not loaded'));
    assert.ok(lines.includes('external not loaded'));
    assert.ok(lines.includes('css backgrounds true true'), 'project SVGs in an inlined stylesheet and an inline <style> load');
    assert.ok(lines.includes('dynamic load event') && !lines.includes('dynamic error event'), 'a project SVG assigned from JavaScript loads, without an error event');
    const notes = await systemNotes(page);
    assert.ok(notes.some((n) => n.includes(t('uk', 'sys.missing-file', { detail: 'img/missing.svg' }))), `missing project file is named (${notes})`);
    assert.ok(notes.some((n) => n.includes(t('uk', 'sys.resource-blocked', { detail: 'https://example.com/photo.png' }))), 'external address is reported as blocked');
    assert.ok(!notes.some((n) => n.includes('img/missing.svg') && n.includes('без мережі')), 'a local path is never blamed on the missing network');
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('a link to another page of the project opens that page, with a way back to the entry page', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openLesson(lab, 1);
    await page.locator('#block-pages-site').waitFor();
    await runButton(page).click();
    await page.locator('.ws-status.ws-status-done').waitFor({ timeout: 15_000 });
    let frame = await runFrame(page);
    await clickInFrame(frame, '#to-about');
    const shown = page.locator('.page-shown');
    await shown.getByText(t('uk', 'ws.pageShown', { file: 'about.html' })).waitFor();
    await waitFor(async () => { frame = await runFrame(page); return frame && (await frame.locator('#about-text').count()) === 1; }, { message: 'about.html is shown' });
    await page.getByRole('tab', { name: t('uk', 'ws.console') }).click();
    await waitFor(async () => (await consoleLines(page)).includes('about page'), { message: 'about.html ran' });
    await page.getByRole('tab', { name: t('uk', 'ws.preview') }).click();

    // Run again keeps the page; the link back inside the page returns to the entry.
    await runButton(page).click();
    await page.locator('.ws-status.ws-status-done').waitFor({ timeout: 15_000 });
    assert.ok(await shown.isVisible(), 'Run re-runs the page that is shown');
    frame = await runFrame(page);
    await clickInFrame(frame, '#to-home');
    await shown.waitFor({ state: 'detached' });
    await waitFor(async () => { frame = await runFrame(page); return frame && (await frame.locator('#to-about').count()) === 1; }, { message: 'index.html is shown again' });

    // The control in the result panel returns as well.
    await clickInFrame(frame, '#to-about');
    await shown.waitFor();
    await shown.getByRole('button', { name: t('uk', 'ws.pageBack', { file: 'index.html' }) }).click();
    await shown.waitFor({ state: 'detached' });
    await waitFor(async () => { frame = await runFrame(page); return frame && (await frame.locator('h1').innerText()) === 'Головна сторінка'; }, { message: 'back at the entry page' });
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('authored feedback for SyntaxError appears next to a syntax error found before running; check titles render code', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openLesson(lab, 2);
    const exercise = page.locator('#block-pages-fix');
    await exercise.waitFor();
    await checkButton(page).click();
    const card = page.locator('.error-card').filter({ hasText: t('uk', 'ws.compileError') });
    await card.waitFor({ timeout: 15_000 });
    assert.match(await card.innerText(), /ФІКСТУРА-СИНТАКСИС: JavaScript не зміг прочитати рядок/);
    assert.match(await card.locator('.error-guide').innerText(), new RegExp(t('uk', 'err.guide.syntax').slice(0, 30)), 'the generic guidance stays');
    assert.ok(await card.locator('.error-original pre').innerText(), 'the verbatim diagnostic stays');
    // The same feedback on Run, and in English.
    await page.locator('.lang-switch').getByRole('button', { name: 'EN', exact: true }).click();
    await page.locator('.ws-actions').getByRole('button', { name: t('en', 'ws.run'), exact: true }).click();
    await page.locator('.error-card').filter({ hasText: 'FIXTURE-SYNTAX' }).waitFor();
    await page.locator('.lang-switch').getByRole('button', { name: 'UA', exact: true }).click();

    // Fixed code passes; the check title shows its inline code as code, not markup.
    await replaceEditor(page, 'console.log("Привіт");\n');
    await checkButton(page).click();
    await page.locator('.tests-summary.tests-ok').waitFor({ timeout: 15_000 });
    const title = page.locator('.test-title').first();
    assert.equal(await title.locator('code').innerText(), 'console.log');
    assert.equal((await title.textContent()).trim(), 'Виводить привітання через console.log');
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('code-trace hides the Variables, Call stack and Heap panels that are empty in every step', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openLesson(lab, 1);
    const panels = (blockId) => page.locator(`#block-${blockId} .viz .viz-panel`).evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
    await page.locator('#block-pages-trace-none .viz').waitFor();
    assert.deepEqual(await panels('pages-trace-none'), ['Код', 'Console'], 'only the code and its output: no variables, calls or objects');
    await page.locator('#block-pages-trace-vars .viz').waitFor();
    assert.deepEqual(await panels('pages-trace-vars'), ['Код', 'Змінні', 'Console'], 'variables, but no call stack or heap');
    assert.equal(await page.locator('#block-pages-trace-vars .viz-columns').getAttribute('class'), 'viz-columns viz-columns-single', 'the remaining panel takes the full width');
    // Stepping keeps working and shows the variable's value.
    await page.locator('#block-pages-trace-vars [data-action="next"]').click();
    await page.locator('#block-pages-trace-vars [data-role="caption"]').getByText('ФІКСТУРА-ЗМІННА-2').waitFor();
    assert.match(await page.locator('#block-pages-trace-vars .viz-vars').innerText(), /total[\s\S]*3/);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('the content validator accepts a prediction whose code does not compile when it expects SyntaxError', async () => {
  const child = spawn(process.execPath, ['scripts/content/validate.mjs', '--lesson', L3], { cwd: ROOT, env: { ...process.env, JSLL_CONTENT_ROOT: FIXTURE_CONTENT } });
  let output = '';
  child.stdout.on('data', (d) => { output += d; });
  child.stderr.on('data', (d) => { output += d; });
  const code = await new Promise((resolve) => child.on('close', resolve));
  assert.equal(code, 0, output);
  assert.match(output, /CONTENT VALID: 1 lesson\(s\), 1 example run\(s\), \d+ exercise fixture run\(s\), 1 verified prediction\(s\)/);
  assert.ok(path.isAbsolute(FIXTURE_CONTENT));
});
