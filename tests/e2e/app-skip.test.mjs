// V-02 (lesson-level) / REQ-003 / REQ-033: "I know this" skips visibly and revisitably; a passed
// self-check is separate evidence; skipping never marks exercises passed; resuming works; the
// self-check never overwrites the learner's lesson draft.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, L2, Lab, buildFixtureDist, editor, editorText, gotoLesson, launchChrome, onboard, openApp, replaceEditor, t, waitFor, waitSaved } from './helpers.mjs';

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

const lessonProgress = async (lab, id) => (await lab.doc('progress'))?.lessons?.[id] ?? null;
const row = (page, title) => page.locator('.unit-card .lesson-row').filter({ hasText: title });
const known = (page) => page.locator('.lesson-footer').getByRole('button', { name: new RegExp(t('uk', 'lesson.known')) });

test('skip without a check: visibly skipped, nothing passed, revisitable and resumable', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    await onboard(page);
    await known(page).click();
    const dialog = page.getByRole('dialog', { name: t('uk', 'skip.title') });
    await dialog.waitFor();
    await dialog.getByRole('button', { name: t('uk', 'skip.without') }).click();
    await page.waitForURL(new RegExp(`#/lesson/${L2}/1$`), { timeout: 5000 });
    const p = await waitFor(() => lessonProgress(lab, L1).then((x) => (x?.state === 'skipped' ? x : false)), { message: 'skip stored' });
    assert.ok(p.skippedAt);
    assert.equal(p.selfCheck, undefined, 'no self-check evidence was invented');
    assert.deepEqual(Object.values(p.exercises).filter((e) => e.passedAt), [], 'no exercise counts as passed');

    await page.goto(lab.url('#/course'));
    const r = row(page, 'Фікстура: інструкції та вивід');
    await r.waitFor();
    assert.match(await r.locator('.sr-only').first().textContent(), new RegExp(t('uk', 'state.skipped')));
    assert.equal(await r.locator('.state-icon.state-skipped').count(), 1);
    assert.equal(await r.locator('.badge').count(), 0, 'no evidence badges for a plain skip');

    // Revisit: the content is there, with a clear "skipped" banner and a way to resume.
    await r.getByRole('link').click();
    const banner = page.getByRole('status').filter({ hasText: t('uk', 'lesson.skipped') });
    await banner.waitFor();
    await page.locator('#block-basics-intro').waitFor();
    await banner.getByRole('button', { name: t('uk', 'lesson.resume') }).click();
    await banner.waitFor({ state: 'detached' });
    await waitFor(() => lessonProgress(lab, L1).then((x) => x?.state === 'in-progress'), { message: 'resumed' });
    await page.locator('.pager').getByRole('button', { name: t('uk', 'lesson.next') }).click();
    await page.locator('#block-basics-exercise').waitFor();
    await waitFor(() => lessonProgress(lab, L1).then((x) => x?.page === 1 && x.seenBlocks.includes('basics-exercise')), { message: 'progress tracked again after resuming' });
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('a passed self-check is separate evidence, keeps the lesson draft and never passes the exercise', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    await onboard(page);
    await page.locator('.pager').getByRole('button', { name: t('uk', 'lesson.next') }).click();
    await page.locator('#block-basics-exercise').waitFor();
    // The learner's own (unfinished) lesson work.
    const lessonCode = "import { label } from './label.js';\n// my lesson attempt, unfinished\n";
    await editor(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText(lessonCode);
    await waitSaved(page);

    await known(page).click();
    // Count modal openings: a dialog must open once, not again on every re-render.
    await page.evaluate(() => {
      window.__opened = 0;
      const show = HTMLDialogElement.prototype.showModal;
      HTMLDialogElement.prototype.showModal = function showModal() { window.__opened += 1; return show.call(this); };
    });
    await page.getByRole('dialog', { name: t('uk', 'skip.title') }).getByRole('button', { name: t('uk', 'skip.selfCheck') }).click();
    const dialog = page.getByRole('dialog', { name: t('uk', 'skip.selfCheckTitle') });
    await dialog.waitFor();
    assert.equal(await page.locator('[id="block-basics-exercise"]').count(), 1, 'no duplicate block ids while the self-check is open');

    // Prediction, by keyboard: focus must stay where the learner is while the dialog updates.
    const option = dialog.locator('input[type=radio]').first();
    await option.focus();
    await page.keyboard.press('Space');
    await dialog.getByRole('button', { name: t('uk', 'q.submit') }).focus();
    await page.keyboard.press('Enter');
    await dialog.locator('.question-result.result-ok').waitFor();
    await page.waitForTimeout(200);
    assert.ok(await dialog.locator('.question-result').evaluate((el) => el.contains(document.activeElement)), 'focus stays on the answer result inside the dialog');

    // The exercise inside the self-check starts fresh and is the learner's separate attempt.
    const scEditor = dialog.locator('.ws-editor .cm-content');
    assert.doesNotMatch(await scEditor.innerText(), /my lesson attempt/);
    await scEditor.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText("import { label } from './label.js';\nconsole.log(label, 3);\n");
    await dialog.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.check') }).click();
    await dialog.locator('.tests-summary.tests-ok').waitFor({ timeout: 15_000 });
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), t('uk', 'ws.check'), 'focus stays on Check after the result arrives');
    assert.equal(await page.evaluate(() => window.__opened), 1, 'the self-check dialog was opened exactly once');
    await waitSaved(page);
    const drafts = await lab.doc(`drafts/${L1}`);
    assert.equal(drafts.blocks['basics-exercise'].files['index.js'], lessonCode, 'the lesson draft survives the self-check');
    assert.match(drafts.blocks['selfcheck:basics-exercise'].files['index.js'], /console\.log\(label, 3\)/, 'the self-check attempt is stored on its own');

    await dialog.getByRole('button', { name: t('uk', 'skip.finish') }).click();
    await dialog.getByText(t('uk', 'skip.selfCheckPassed')).waitFor();
    await dialog.getByRole('button', { name: t('uk', 'common.close') }).click();
    await page.waitForURL(new RegExp(`#/lesson/${L2}/1$`));

    const p = await waitFor(() => lessonProgress(lab, L1).then((x) => (x?.state === 'skipped' && x.selfCheck?.passedAt ? x : false)), { message: 'skip with self-check stored' });
    assert.equal(p.exercises['basics-exercise']?.passedAt, undefined, 'skipping never marks the exercise passed');
    assert.equal(p.questions['basics-predict'], undefined, 'self-check answers are not lesson answers');

    await page.goto(lab.url('#/course'));
    const r = row(page, 'Фікстура: інструкції та вивід');
    await r.waitFor();
    assert.match(await r.locator('.evidence').innerText(), new RegExp(t('uk', 'evidence.selfCheck')));
    assert.doesNotMatch(await r.locator('.evidence').innerText(), new RegExp(t('uk', 'evidence.exercises', { done: 1, total: 1 })));
    assert.match(await r.locator('.sr-only').first().textContent(), new RegExp(t('uk', 'state.skipped')));

    // Revisit: the lesson editor still holds the lesson attempt; the banner shows the evidence.
    await page.goto(lab.url(`#/lesson/${L1}/2`));
    await page.locator('#block-basics-exercise').waitFor();
    assert.equal(await editorText(page), lessonCode);
    assert.match(await page.getByRole('status').filter({ hasText: t('uk', 'lesson.skipped') }).innerText(), new RegExp(t('uk', 'evidence.selfCheck')));
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('a failed self-check is recorded without a pass; skipping a whole unit skips only authored lessons', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    await onboard(page);
    await page.goto(lab.url(`#/lesson/${L2}/1`));
    await page.locator('#block-practice-intro').waitFor();
    await known(page).click();
    await page.getByRole('dialog', { name: t('uk', 'skip.title') }).getByRole('button', { name: t('uk', 'skip.selfCheck') }).click();
    const dialog = page.getByRole('dialog', { name: t('uk', 'skip.selfCheckTitle') });
    await dialog.getByRole('textbox', { name: t('uk', 'q.yourAnswer') }).fill('7');
    await dialog.getByRole('button', { name: t('uk', 'q.submit') }).click();
    await dialog.locator('.question-result.result-no').waitFor();
    await dialog.getByRole('button', { name: t('uk', 'skip.finish') }).click();
    await dialog.getByText(t('uk', 'skip.selfCheckFailed')).waitFor();
    // "Go to the lesson": stay, nothing skipped.
    await dialog.getByRole('button', { name: t('uk', 'skip.goLesson') }).click();
    await dialog.waitFor({ state: 'detached' });
    const p = await waitFor(() => lessonProgress(lab, L2).then((x) => (x?.selfCheck ? x : false)), { message: 'failed self-check stored' });
    assert.equal(p.selfCheck.attempts, 1);
    assert.equal(p.selfCheck.passedAt, undefined);
    assert.equal(p.state, 'in-progress');

    // Skip the whole unit from the course map (asks for confirmation first).
    await page.goto(lab.url('#/course'));
    const unit = page.locator('.unit-card[aria-labelledby="unit-JS-01"]');
    await unit.waitFor();
    page.once('dialog', (d) => d.accept());
    await unit.getByRole('button', { name: t('uk', 'course.skipUnit') }).click();
    await waitFor(async () => (await lessonProgress(lab, L1))?.state === 'skipped' && (await lessonProgress(lab, L2))?.state === 'skipped', { message: 'unit skipped' });
    assert.equal(await lessonProgress(lab, 'js-01-03-fixture-planned'), null, 'planned, unpublished lessons are not touched');
    assert.equal((await lessonProgress(lab, L2)).selfCheck.passedAt, undefined);
    assert.equal(await unit.locator('.state-icon.state-skipped').count(), 2);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('assessment lessons cannot be skipped and their assessment exercise opens the solution only after it passed', async () => {
  const lab = await Lab.start({ distDir });
  const A = 'js-02-03-fixture-assessment';
  try {
    const { page, problems, context } = await openApp(browser, lab);
    await onboard(page);
    await gotoLesson(page, A, 1);
    const card = page.locator('#block-sum-check');
    await card.waitFor();
    assert.equal(await known(page).count(), 0, 'no "I know this" on an assessment lesson');
    await page.locator('.lesson-footer').getByText(t('uk', 'lesson.assessmentNoSkip')).waitFor();
    assert.equal(await card.getByRole('button', { name: t('uk', 'hint.solution') }).count(), 0, 'no "Show the solution" before the check passed');
    await card.getByText(t('uk', 'hint.solutionAfterPass')).waitFor();

    await replaceEditor(page, 'export function sum(a, b) {\n  return b + a;\n}\n');
    await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.check') }).click();
    await card.getByRole('button', { name: t('uk', 'hint.solution') }).waitFor({ timeout: 15_000 });
    assert.equal(await card.getByText(t('uk', 'hint.solutionAfterPass')).count(), 0);
    await waitFor(async () => (await lessonProgress(lab, A))?.state === 'completed', { message: 'assessment completed through its exercise' });

    // Skipping the unit from the course map leaves an assessment lesson alone.
    const lab2 = await Lab.start({ distDir });
    try {
      const second = await openApp(browser, lab2);
      await onboard(second.page);
      await second.page.goto(lab2.url('#/course'));
      const unit = second.page.locator('.unit-card[aria-labelledby="unit-JS-02"]');
      await unit.waitFor();
      second.page.once('dialog', (d) => d.accept());
      await unit.getByRole('button', { name: t('uk', 'course.skipUnit') }).click();
      await waitFor(async () => (await lessonProgress(lab2, 'js-02-01-fixture-pages'))?.state === 'skipped', { message: 'unit skipped' });
      assert.equal(await lessonProgress(lab2, A), null, 'the assessment lesson is not skipped with its unit');
      assert.equal(await unit.getByRole('button', { name: t('uk', 'course.skipUnit') }).count(), 0, 'nothing skippable is left open');
      assert.deepEqual(second.problems, []);
      await second.context.close();
    } finally {
      await lab2.dispose();
    }
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});
