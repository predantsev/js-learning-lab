// V-09 / REQ-018 / REQ-019 / REQ-033: a failing check reveals nothing by itself; hints open one level
// at a time on request; the solution needs confirmation, is shown separately and never changes the
// editor; hint, solution and pass evidence are stored independently and shown on the course map.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, L2, Lab, buildFixtureDist, editorText, exact, launchChrome, onboard, openApp, replaceEditor, t, waitFor, waitSaved } from './helpers.mjs';

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

const WRONG = "import { label } from './label.js';\nconsole.log(label, \"3\");\n";
const RIGHT = "import { label } from './label.js';\nconsole.log(label, 3);\n";
const exerciseProgress = async (lab) => (await lab.doc('progress'))?.lessons?.[L1]?.exercises?.['basics-exercise'] ?? {};
const lessonRow = (page, title) => page.locator('.unit-card .lesson-row').filter({ hasText: title });

test('hints and the solution are voluntary, ordered, separate from the editor and recorded as evidence', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    await onboard(page);
    await page.locator('.pager').getByRole('button', { name: t('uk', 'lesson.next') }).click();
    const card = page.locator('#block-basics-exercise');
    await card.waitFor();
    const nothingRevealed = async () => {
      const text = await card.innerText();
      return !text.includes('ФІКСТУРА-НАТЯК-1') && !text.includes('ФІКСТУРА-НАТЯК-2') && !text.includes('ФІКСТУРА-РОЗВ’ЯЗАННЯ') && (await card.locator('.solution').count()) === 0;
    };
    assert.ok(await nothingRevealed(), 'a fresh exercise shows no hint and no solution');

    // A failing check: feedback, but no hint or solution appears by itself.
    await replaceEditor(page, WRONG);
    await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.check') }).click();
    await page.locator('.tests-summary').filter({ hasText: t('uk', 'ws.passedSome', { passed: 1, total: 2 }) }).waitFor({ timeout: 15_000 });
    assert.match(await page.locator('.tests').innerText(), /Друге значення має бути числом/, 'authored feedback for the failing test');
    assert.ok(await nothingRevealed(), 'failure never reveals hints or the solution');
    assert.equal(await editorText(page), WRONG, 'feedback does not touch the code');
    let ex = await waitFor(async () => { const e = await exerciseProgress(lab); return e.attempts === 1 ? e : false; }, { message: 'failed attempt recorded' });
    assert.equal(ex.passedAt, undefined);
    assert.equal(ex.hintNudgeAt, undefined);

    // Level 1, then level 2 — one at a time, on request.
    await card.getByRole('button', { name: t('uk', 'hint.need') }).click();
    await card.getByText('ФІКСТУРА-НАТЯК-1').waitFor();
    assert.ok(!(await card.innerText()).includes('ФІКСТУРА-НАТЯК-2'), 'only the nudge is shown');
    ex = await waitFor(async () => { const e = await exerciseProgress(lab); return e.hintNudgeAt ? e : false; }, { message: 'nudge recorded' });
    assert.equal(ex.hintExplanationAt, undefined);
    await card.getByRole('button', { name: t('uk', 'hint.more') }).click();
    await card.getByText('ФІКСТУРА-НАТЯК-2').waitFor();
    await waitFor(async () => Boolean((await exerciseProgress(lab)).hintExplanationAt), { message: 'explanation recorded' });
    assert.equal((await exerciseProgress(lab)).solutionViewedAt, undefined, 'hints do not count as viewing the solution');

    // The solution needs an explicit confirmation; cancelling records nothing.
    await card.getByRole('button', { name: t('uk', 'hint.solution') }).click();
    const confirm = page.getByRole('dialog', { name: t('uk', 'hint.solution') });
    await confirm.waitFor();
    assert.match(await confirm.innerText(), new RegExp(t('uk', 'hint.solutionConfirm').slice(0, 40)));
    await confirm.getByRole('button', { name: t('uk', 'hint.cancel') }).click();
    await confirm.waitFor({ state: 'hidden' });
    assert.equal(await card.locator('.solution').count(), 0);
    await waitSaved(page);
    assert.equal((await exerciseProgress(lab)).solutionViewedAt, undefined);
    await card.getByRole('button', { name: t('uk', 'hint.solution') }).click();
    await confirm.waitFor();
    await confirm.getByRole('button', { name: t('uk', 'hint.solutionShow') }).click();
    const solution = card.locator('.solution');
    await solution.waitFor();
    assert.match(await solution.innerText(), /console\.log\(label, 3\);/);
    assert.match(await solution.innerText(), /ФІКСТУРА-РОЗВ’ЯЗАННЯ/);
    assert.equal(await solution.locator('.cm-content').getAttribute('contenteditable'), 'false', 'the solution is read-only');
    assert.equal(await editorText(page), WRONG, 'viewing the solution never changes the editor');
    ex = await waitFor(async () => { const e = await exerciseProgress(lab); return e.solutionViewedAt ? e : false; }, { message: 'solution viewing recorded' });
    assert.equal(ex.passedAt, undefined, 'viewing the solution does not pass the exercise');

    // Course map: assistance is visible, the exercise is not counted as passed.
    await page.goto(lab.url('#/course'));
    const row = lessonRow(page, 'Фікстура: інструкції та вивід');
    await row.waitFor();
    let badges = await row.locator('.evidence').innerText();
    assert.match(badges, new RegExp(t('uk', 'evidence.hints')));
    assert.match(badges, new RegExp(t('uk', 'evidence.solution')));
    assert.doesNotMatch(badges, new RegExp(t('uk', 'evidence.exercises', { done: 1, total: 1 })));
    assert.match(await row.innerText(), new RegExp(t('uk', 'state.in-progress')));

    // Retry with the learner's own fix: passing is recorded separately and honestly as assisted.
    await page.goto(lab.url(`#/lesson/${L1}/2`));
    await card.waitFor();
    assert.equal(await editorText(page), WRONG);
    await replaceEditor(page, RIGHT);
    await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.check') }).click();
    await page.locator('.tests-summary.tests-ok').waitFor({ timeout: 15_000 });
    assert.match(await page.locator('.ws-status').innerText(), new RegExp(t('uk', 'ws.exercisePassedAssisted').replace(/[()]/g, '\\$&')));
    ex = await waitFor(async () => { const e = await exerciseProgress(lab); return e.passedAt ? e : false; }, { message: 'pass recorded' });
    assert.equal(ex.assistedPass, true);
    assert.ok(ex.hintNudgeAt && ex.hintExplanationAt && ex.solutionViewedAt, 'assistance evidence is kept next to the pass');
    await page.goto(lab.url('#/course'));
    await row.waitFor();
    badges = await row.locator('.evidence').innerText();
    assert.match(badges, new RegExp(t('uk', 'evidence.exercises', { done: 1, total: 1 })));
    assert.match(badges, new RegExp(t('uk', 'evidence.hints')));
    assert.match(badges, new RegExp(t('uk', 'evidence.solution')));

    // Revealed levels stay revealed after a reload (they are evidence, not transient UI).
    await page.goto(lab.url(`#/lesson/${L1}/2`));
    await page.reload();
    await card.getByText('ФІКСТУРА-НАТЯК-2').waitFor();
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('an independent exercise has no hints; its solution still needs confirmation', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    await onboard(page);
    await page.goto(lab.url(`#/lesson/${L2}/2`));
    const card = page.locator('#block-practice-independent');
    await card.waitFor();
    assert.match(await card.innerText(), new RegExp(t('uk', 'block.exercise.independent'), 'i'));
    assert.match(await card.innerText(), new RegExp(t('uk', 'hint.none')));
    assert.equal(await card.getByRole('button', { name: t('uk', 'hint.need') }).count(), 0);
    await card.getByRole('button', { name: exact('uk', 'hint.solution') }).click();
    await page.getByRole('dialog', { name: t('uk', 'hint.solution') }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog', { name: t('uk', 'hint.solution') }).waitFor({ state: 'hidden' });
    assert.equal(await card.locator('.solution').count(), 0, 'Escape cancels without revealing');
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});
