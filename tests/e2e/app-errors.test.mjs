// V-15 / REQ-032: missing content, corrupt content, an unreachable server, a sandbox that cannot
// start and damaged learner data each show their own state, keep the learner's work and offer a
// way back; nothing claims "saved" or "passed" falsely.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { L1, L2, Lab, buildFixtureDist, editorText, launchChrome, openApp, replaceEditor, saveIndicator, t, waitSaved } from './helpers.mjs';

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
const stateCard = (page) => page.locator('.state-card');

test('a missing lesson and a corrupt lesson file show distinct states; learner data stays intact', async () => {
  const lab = await Lab.start({ distDir });
  const lessonFile = path.join(distDir, 'content', 'lessons', `${L2}.json`);
  const original = await fs.readFile(lessonFile, 'utf8');
  try {
    await lab.seed('profile', PROFILE);
    const draft = { blocks: { 'basics-exercise': { files: { 'index.js': '// my work\n', 'label.js': 'export const label = "x";\n' }, lang: 'uk', updatedAt: PROFILE.createdAt } } };
    await lab.seed(`drafts/${L1}`, draft);
    const { page, problems, context } = await openApp(browser, lab, { hash: '#/lesson/js-01-99-fixture-missing/1' });

    // Missing (a plausible id that this content version does not have).
    await stateCard(page).waitFor();
    assert.equal(await stateCard(page).getAttribute('role'), 'alert');
    assert.match(await stateCard(page).innerText(), new RegExp(t('uk', 'lesson.missingTitle')));
    assert.match(await stateCard(page).innerText(), new RegExp(t('uk', 'lesson.missingBody').slice(0, 30)));
    assert.ok(await stateCard(page).getByRole('link', { name: t('uk', 'lesson.toCourse') }).isVisible(), 'a way back to the course');

    // A malformed id in the address is "missing" as well, not a server problem.
    await page.evaluate(() => { location.hash = '#/lesson/Not%20A%20Lesson/1'; });
    await page.waitForFunction(() => location.hash.includes('Not'));
    await stateCard(page).filter({ hasText: t('uk', 'lesson.missingTitle') }).waitFor();
    assert.doesNotMatch(await stateCard(page).innerText(), new RegExp(t('uk', 'error.serverUnreachable').slice(0, 25)));

    // Corrupt compiled lesson JSON.
    await fs.writeFile(lessonFile, '{"id": "js-01-02-fixture-practice", "blocks": [ broken');
    await page.evaluate((id) => { location.hash = `#/lesson/${id}/1`; }, L2);
    const corrupt = stateCard(page).filter({ hasText: t('uk', 'error.contentCorrupt').slice(0, 30) });
    await corrupt.waitFor();
    assert.match(await corrupt.innerText(), new RegExp(t('uk', 'error.title')));
    assert.doesNotMatch(await corrupt.innerText(), new RegExp(t('uk', 'lesson.missingTitle')), 'corrupt is not reported as missing');

    // Non-destructive: the other lesson and the learner's draft are untouched.
    await page.evaluate((id) => { location.hash = `#/lesson/${id}/2`; }, L1);
    await page.locator('#block-basics-exercise').waitFor();
    assert.equal(await editorText(page), '// my work\n');
    assert.deepEqual(await lab.doc(`drafts/${L1}`), draft);
    assert.equal(await lab.doc('progress').then((p) => p?.lessons?.[L2] ?? null), null, 'no progress invented for the broken lesson');
    // The 404s of the missing lessons are the scenario itself; nothing else may fail.
    assert.deepEqual(problems.filter((p) => !/\/content\/lessons\/(js-01-99-fixture-missing|Not%20A%20Lesson)\.json/.test(p)), []);
    await context.close();
  } finally {
    await fs.writeFile(lessonFile, original);
    await lab.dispose();
  }
});

test('a corrupt course index stops with a bilingual explanation and touches no learner data', async () => {
  const lab = await Lab.start({ distDir });
  const indexFile = path.join(distDir, 'content', 'index.json');
  const original = await fs.readFile(indexFile, 'utf8');
  try {
    await lab.seed('profile', PROFILE);
    await fs.writeFile(indexFile, original.slice(0, Math.floor(original.length / 2)));
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(lab.url('#/course'));
    const fatal = page.locator('.state-card.fatal');
    await fatal.waitFor();
    const text = await fatal.innerText();
    assert.match(text, new RegExp(t('uk', 'error.contentCorrupt').slice(0, 30)));
    assert.match(text, new RegExp(t('en', 'error.contentCorrupt').slice(0, 30)));
    assert.ok(await fatal.getByRole('button', { name: new RegExp(t('uk', 'error.reload')) }).isVisible(), 'offers a reload');
    assert.deepEqual(await lab.doc('profile'), PROFILE, 'learner data untouched');
    await ctx.close();
  } finally {
    await fs.writeFile(indexFile, original);
    await lab.dispose();
  }
});

test('an unreachable server: work stays, nothing claims saved, unloaded lessons explain, restart recovers', async () => {
  const lab = await Lab.start({ distDir });
  try {
    await lab.seed('profile', PROFILE);
    const { page, context } = await openApp(browser, lab, { hash: `#/lesson/${L1}/2` });
    await page.locator('#block-basics-exercise').waitFor();
    const before = "import { label } from './label.js';\nconsole.log(label, 'saved before the outage');\n";
    await replaceEditor(page, before);
    await waitSaved(page);

    await lab.stop();
    const during = "import { label } from './label.js';\nconsole.log(label, 'typed during the outage');\n";
    await replaceEditor(page, during);
    await page.locator('.save-indicator.save-failed').waitFor({ timeout: 6000 });
    assert.equal((await saveIndicator(page).innerText()).trim(), t('uk', 'save.failed'));
    const banner = page.getByRole('alert').filter({ hasText: t('uk', 'save.failedTitle') });
    await banner.waitFor();
    assert.match(await banner.innerText(), /server-unreachable/, 'the technical detail names the cause');
    assert.equal(await editorText(page), during, 'the editor keeps the work');

    // A lesson that was never loaded in this tab cannot load now: its own explanation.
    await page.evaluate((id) => { location.hash = `#/lesson/${id}/1`; }, L2);
    const card = stateCard(page).filter({ hasText: t('uk', 'error.serverUnreachable').slice(0, 30) });
    await card.waitFor({ timeout: 10_000 });
    assert.doesNotMatch(await card.innerText(), new RegExp(t('uk', 'lesson.missingTitle')));

    // The server comes back on the same address: retry saves the work typed during the outage.
    await lab.restart();
    await banner.getByRole('button', { name: t('uk', 'save.retry') }).click();
    await waitSaved(page);
    assert.equal((await lab.doc(`drafts/${L1}`)).blocks['basics-exercise'].files['index.js'], during);
    // The lesson that could not load offers its own retry.
    await card.getByRole('button', { name: t('uk', 'error.retry') }).click();
    await page.locator('#block-practice-intro').waitFor();
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('a sandbox that cannot start is explained; the editor keeps the code and a later run works', async () => {
  const lab = await Lab.start({ distDir });
  try {
    await lab.seed('profile', PROFILE);
    const { page, problems, context } = await openApp(browser, lab, { hash: `#/lesson/${L1}/1` });
    await page.locator('#block-basics-example').waitFor();
    await replaceEditor(page, 'console.log("still mine");\n');
    await context.route(/\/sandbox\/frame\.html/, (route) => route.abort('connectionrefused'));
    await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.run') }).click();
    const status = page.locator('.ws-status');
    await page.locator('.ws-status.ws-status-failed').waitFor({ timeout: 15_000 });
    assert.equal((await status.innerText()).trim(), t('uk', 'ws.sandboxUnreachable'));
    assert.equal(await status.getAttribute('role'), 'status');
    assert.equal(await editorText(page), 'console.log("still mine");\n');
    assert.equal(await page.locator('.console-line').count(), 0, 'no invented output');

    await context.unroute(/\/sandbox\/frame\.html/);
    await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.run') }).click();
    await page.locator('.console').getByText('still mine').waitFor();
    assert.equal((await status.innerText()).trim(), t('uk', 'ws.finished'));
    await waitSaved(page);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('damaged learner data: recovered from the backup copy with a notice, or a clear stop without touching the file', async () => {
  const lab = await Lab.start({ distDir });
  try {
    // Two saves leave a backup copy (.bak) of the previous version next to the document.
    await lab.seed('profile', PROFILE);
    await lab.seed('bookmarks', { items: [{ id: 'b1', lessonId: L1, blockId: 'basics-intro', createdAt: PROFILE.createdAt }] });
    await lab.seed('bookmarks', { items: [{ id: 'b1', lessonId: L1, blockId: 'basics-intro', createdAt: PROFILE.createdAt }, { id: 'b2', lessonId: L1, blockId: 'basics-example', createdAt: PROFILE.createdAt }] });
    const docs = path.join(lab.dataDir, 'docs');
    await fs.writeFile(path.join(docs, 'bookmarks.json'), '{"rev": 2, "data": {"items": [ truncated');
    const recovered = await openApp(browser, lab, { hash: '#/bookmarks' });
    const notice = recovered.page.getByRole('status').filter({ hasText: t('uk', 'error.recovered', { doc: 'bookmarks' }) });
    await notice.waitFor();
    assert.equal(await recovered.page.locator('.bookmark').count(), 1, 'the previous saved version is shown');
    assert.deepEqual(recovered.problems, []);
    await recovered.context.close();

    // No readable backup: the application stops with an explanation and never overwrites the file.
    const damaged = '{"rev": 3, "data": { half a profile';
    await fs.writeFile(path.join(docs, 'profile.json'), damaged);
    await fs.rm(path.join(docs, 'profile.json.bak'), { force: true });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(lab.url('#/course'));
    const fatal = page.locator('.state-card.fatal');
    await fatal.waitFor();
    assert.equal(await fatal.getAttribute('role'), 'alert');
    const text = await fatal.innerText();
    assert.match(text, new RegExp(t('uk', 'error.storeCorrupt', { doc: 'profile.json' }).slice(0, 40)));
    assert.match(text, /profile\.json/, 'names the damaged file');
    assert.match(text, new RegExp(t('en', 'error.title')), 'shows both languages before the profile language is known');
    assert.equal(await fs.readFile(path.join(docs, 'profile.json'), 'utf8'), damaged, 'the damaged file is left as it was');
    await ctx.close();
  } finally {
    await lab.dispose();
  }
});
