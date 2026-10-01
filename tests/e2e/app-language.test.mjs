// V-08 / REQ-015 / REQ-016: Ukrainian by default; the global switch keeps code, page and progress;
// the per-block EN/UA control translates only its block (both directions) without touching global
// language, other blocks, drafts, disclosures or focus; learner code is never rewritten; a fresh
// exercise starter follows the lesson language.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, Lab, buildFixtureDist, editorText, launchChrome, onboard, openApp, replaceEditor, t, waitFor, waitSaved } from './helpers.mjs';

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

const globalSwitch = (page, code) => page.locator('.lang-switch').getByRole('button', { name: code, exact: true });
const blockToggle = (page, blockId) => page.locator(`#block-${blockId} .block-actions button`).first();
const fileTab = (page, name) => page.getByRole('tab', { name: new RegExp(`^\\s*${name.replace('.', '\\.')}`) });

test('fresh profile is Ukrainian; the global switch keeps code, page and progress; starters follow the lesson language', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
    await page.getByRole('heading', { level: 1, name: t('uk', 'onboarding.title') }).waitFor();
    await onboard(page);
    await page.locator('.pager').getByRole('button', { name: t('uk', 'lesson.next') }).click();
    await page.locator('#block-basics-exercise').waitFor();
    await waitSaved(page);

    // A fresh starter (no draft yet) follows the language: %%item%% → localized string.
    await fileTab(page, 'label.js').click();
    assert.equal(await editorText(page), 'export const label = "Настільна лампа";\n');
    await globalSwitch(page, 'EN').click();
    await waitFor(async () => (await page.locator('html').getAttribute('lang')) === 'en', { message: 'global language en' });
    assert.equal(await page.locator('.pager').getByRole('button').last().innerText(), t('en', 'lesson.next'));
    assert.equal(await editorText(page), 'export const label = "Desk lamp";\n');
    await waitSaved(page);
    const entry = (await lab.doc(`drafts/${L1}`))?.blocks?.['basics-exercise'];
    assert.equal(entry?.activeFile, 'label.js', 'the selected file is remembered');
    assert.equal(entry?.files, undefined, 'choosing a tab or switching language never snapshots the starter as learner code');
    await globalSwitch(page, 'UA').click();
    await waitFor(async () => (await page.locator('html').getAttribute('lang')) === 'uk', { message: 'global language uk' });
    assert.equal(await editorText(page), 'export const label = "Настільна лампа";\n', 'the untouched starter follows back');

    // Learner code (with Ukrainian comments and text) is never rewritten by a language switch.
    await fileTab(page, 'index.js').click();
    const mine = "import { label } from './label.js';\n// мій коментар: друкую назву\nconsole.log(label, 'моє', 3);\n";
    await replaceEditor(page, mine);
    await waitSaved(page);
    const progressBefore = await lab.doc('progress');
    await globalSwitch(page, 'EN').click();
    await waitFor(async () => (await page.locator('html').getAttribute('lang')) === 'en', { message: 'global language en' });
    assert.equal(await editorText(page), mine);
    await fileTab(page, 'label.js').click();
    assert.equal(await editorText(page), 'export const label = "Настільна лампа";\n', 'once the learner owns a draft, its files keep their language');
    assert.match(await page.locator('.chip-steps').innerText(), /2/, 'still on the same page');
    assert.match(await page.locator('#block-basics-exercise').innerText(), /Print the label and a number/);
    await waitSaved(page);
    assert.deepEqual((await lab.doc('progress')).lessons[L1].seenBlocks, progressBefore.lessons[L1].seenBlocks, 'progress unchanged');
    assert.equal((await lab.doc('progress')).lessons[L1].state, progressBefore.lessons[L1].state);
    assert.equal((await lab.doc(`drafts/${L1}`)).blocks['basics-exercise'].files['index.js'], mine);

    // The language choice persists.
    await context.close();
    await lab.restart();
    const again = await openApp(browser, lab, { hash: '' });
    assert.equal(await again.page.locator('html').getAttribute('lang'), 'en');
    assert.deepEqual([...problems, ...again.problems], []);
    await again.context.close();
  } finally {
    await lab.dispose();
  }
});

test('the per-block EN/UA control translates only its block, in both directions, keeping state and focus', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    await onboard(page);
    await page.locator('#block-basics-intro').waitFor();
    await waitSaved(page);
    const intro = page.locator('#block-basics-intro');
    const analogy = page.locator('#block-basics-analogy');
    const visual = page.locator('#block-basics-visual');
    const editorBefore = await editorText(page);
    const draftsBefore = await lab.doc(`drafts/${L1}`);

    // Close the visual's text-equivalent disclosure: a disclosure state that must survive.
    const details = visual.locator('details.text-equivalent');
    assert.equal(await details.evaluate((d) => d.open), true);
    await details.locator('summary').click();
    assert.equal(await details.evaluate((d) => d.open), false);

    // UA → EN for the explanation, by keyboard.
    await blockToggle(page, 'basics-intro').focus();
    assert.equal(await blockToggle(page, 'basics-intro').getAttribute('aria-label'), t('uk', 'lang.blockToEn'));
    await page.keyboard.press('Enter');
    await intro.locator('h2', { hasText: 'Statements run in order' }).waitFor();
    assert.equal(await intro.getAttribute('lang'), 'en');
    assert.match(await intro.innerText(), /The first paragraph of the fixture explanation in English/);
    assert.equal(await blockToggle(page, 'basics-intro').getAttribute('aria-pressed'), 'true');
    assert.equal(await blockToggle(page, 'basics-intro').getAttribute('aria-label'), t('uk', 'lang.blockToUk'), 'the control is labelled in the interface language');
    assert.ok(await blockToggle(page, 'basics-intro').evaluate((el) => el === document.activeElement), 'focus stays on the control');
    // Everything else stays Ukrainian.
    assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
    assert.equal(await analogy.getAttribute('lang'), 'uk');
    assert.match(await analogy.innerText(), /Програма схожа на рецепт/);
    assert.match(await visual.innerText(), /Від коду до консолі/);
    assert.match(await page.locator('.pager').innerText(), new RegExp(t('uk', 'lesson.next')));
    // Glossary terms inside the translated block use that block's language.
    await intro.locator('button.term').first().click();
    const popover = page.getByRole('dialog', { name: 'statement' });
    await popover.waitFor();
    assert.match(await popover.innerText(), /One step of a program/);
    await page.keyboard.press('Escape');

    // Analogy (body and limits) and visual (heading and text equivalent) translate in place too.
    await blockToggle(page, 'basics-analogy').click();
    await analogy.getByText('A program is like a recipe').waitFor();
    assert.match(await analogy.innerText(), /Unlike a cook, the computer never skips a step/);
    await blockToggle(page, 'basics-visual').click();
    await visual.getByText('From code to the console').waitFor();
    assert.match(await visual.locator('.text-equivalent').textContent(), /The code goes to the JavaScript engine/);
    assert.equal(await details.evaluate((d) => d.open), false, 'the disclosure keeps its state');
    assert.match(await intro.innerText(), /Statements run in order/, 'the first block is still English');

    // EN → UA back, one block at a time.
    await blockToggle(page, 'basics-intro').click();
    await intro.locator('h2', { hasText: 'Інструкції виконуються по черзі' }).waitFor();
    assert.match(await analogy.innerText(), /A program is like a recipe/, 'other blocks keep their own choice');
    await blockToggle(page, 'basics-analogy').click();
    await blockToggle(page, 'basics-visual').click();
    await visual.getByText('Від коду до консолі').waitFor();
    assert.equal(await editorText(page), editorBefore, 'the editor never changes');
    await waitSaved(page);
    assert.deepEqual(await lab.doc(`drafts/${L1}`), draftsBefore, 'no draft written by block translation');

    // Task and hints of an exercise block, then the opposite direction (global EN, block UA).
    await page.locator('.pager').getByRole('button', { name: t('uk', 'lesson.next') }).click();
    const exercise = page.locator('#block-basics-exercise');
    await exercise.waitFor();
    await exercise.getByRole('button', { name: t('uk', 'hint.need') }).click();
    await exercise.getByText('ФІКСТУРА-НАТЯК-1').waitFor();
    await blockToggle(page, 'basics-exercise').click();
    await exercise.getByText('FIXTURE-HINT-1').waitFor();
    assert.match(await exercise.innerText(), /Print the label and a number/);
    await blockToggle(page, 'basics-exercise').click();
    await globalSwitch(page, 'EN').click();
    await exercise.getByText('FIXTURE-HINT-1').waitFor();
    await blockToggle(page, 'basics-exercise').click();
    await exercise.getByText('ФІКСТУРА-НАТЯК-1').waitFor();
    assert.equal(await exercise.getAttribute('lang'), 'uk');
    assert.equal(await page.locator('html').getAttribute('lang'), 'en', 'the global language stays English');
    assert.match(await page.locator('#block-basics-predict').innerText(), /What appears in the console/);
    assert.ok(await exercise.getByText('FIXTURE-HINT-1').count() === 0);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});
