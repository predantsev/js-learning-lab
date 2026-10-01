// V-15 / REQ-031 (keyboard part): a whole lesson with the keyboard only and visible focus at every
// stop; the glossary popover by keyboard; useful status announcements.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, Lab, buildFixtureDist, launchChrome, openApp, t, waitFor } from './helpers.mjs';

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

/** Where focus is, whether it is on screen and whether it has a visible focus indicator. */
const focusInfo = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body || a === document.documentElement) return { tag: 'BODY', visible: false, indicator: false, name: '' };
  const r = a.getBoundingClientRect();
  const ring = (el) => { const s = getComputedStyle(el); return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 1) || (s.boxShadow !== 'none' && s.boxShadow !== ''); };
  const editor = a.closest('.cm-editor');
  const label = a.getAttribute('aria-label') || (a.labels && a.labels[0] ? a.labels[0].textContent : '') || a.textContent || '';
  return {
    tag: a.tagName,
    id: a.id,
    cls: String(a.className),
    role: a.getAttribute('role') ?? '',
    type: a.getAttribute('type') ?? '',
    name: label.replace(/\s+/g, ' ').trim().slice(0, 90),
    editor: Boolean(editor),
    visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth,
    indicator: ring(a) || (editor ? ring(editor) : false),
  };
});

/**
 * Press Tab (or Shift+Tab) until `match(info)`; every stop on the way must be visible and show a
 * focus indicator. In the code editor Tab indents, so — as the editor help text says — Esc first.
 */
async function tabTo(page, match, { max = 40, back = false, label = 'target' } = {}) {
  const seen = [];
  for (let i = 0; i < max; i += 1) {
    const before = await focusInfo(page);
    if (before.editor) {
      if (await page.locator('.cm-tooltip-autocomplete').count()) await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
    }
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
    let info = await focusInfo(page);
    // CodeMirror marks itself focused asynchronously (~1 frame): allow a short settle.
    for (let wait = 0; !info.indicator && wait < 6; wait += 1) {
      await page.waitForTimeout(50);
      info = await focusInfo(page);
    }
    seen.push(`${info.tag}${info.role ? `[${info.role}]` : ''} "${info.name}"`);
    assert.ok(info.tag !== 'BODY', `focus was lost to the page body after: ${seen.join(' → ')}`);
    assert.ok(info.visible, `focused element is on screen: ${seen.at(-1)}`);
    assert.ok(info.indicator, `focused element shows a focus indicator: ${seen.at(-1)}`);
    assert.notEqual(info.tag, 'IFRAME', `focus must not move into a hidden or result frame: ${seen.join(' → ')}`);
    if (match(info)) return info;
  }
  throw new Error(`could not reach ${label} with ${back ? 'Shift+Tab' : 'Tab'}: ${seen.join(' → ')}`);
}
const named = (re) => (info) => re.test(info.name);
const liveRegion = (page) => page.locator('.app > [role="status"][aria-live="polite"]');

test('a whole lesson is completed with the keyboard only, with visible focus at every stop', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab, { viewport: { width: 1280, height: 800 } });

    // Onboarding: choose a capstone and start, keyboard only.
    await page.getByRole('heading', { level: 1, name: t('uk', 'onboarding.title') }).waitFor();
    await tabTo(page, (i) => i.role === 'radio' && /Список бажань/.test(i.name), { label: 'first capstone' });
    await page.keyboard.press('Space');
    await tabTo(page, named(new RegExp(t('uk', 'onboarding.start'))), { label: 'start button' });
    await page.keyboard.press('Enter');
    await page.waitForURL(new RegExp(`#/lesson/${L1}/1`));
    await page.locator('#block-basics-intro').waitFor();

    // Page 1: run the example.
    await tabTo(page, (i) => i.tag === 'BUTTON' && new RegExp(`^${t('uk', 'ws.run')}$`).test(i.name), { label: 'Run' });
    await page.keyboard.press('Enter');
    await page.locator('.console').getByText('Привіт із фікстури').waitFor();
    assert.equal((await focusInfo(page)).name, t('uk', 'ws.run'), 'focus stays on Run while and after it runs');
    assert.equal(await page.locator('.ws-status').getAttribute('role'), 'status');
    await waitFor(async () => (await page.locator('.ws-status').innerText()).includes(t('uk', 'ws.finished')), { message: 'run status announced' });
    await tabTo(page, named(new RegExp(`^${t('uk', 'lesson.next')}$`)), { label: 'Next' });
    await page.keyboard.press('Enter');
    await page.locator('#block-basics-predict').waitFor();

    // Page 2: answer the prediction with arrow keys and Space, submit with Enter.
    await tabTo(page, (i) => i.tag === 'INPUT' && i.type === 'radio', { label: 'first answer option' });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    assert.equal(await page.locator('#block-basics-predict input[type=radio]').first().isChecked(), true, 'arrow keys move the selection');
    await tabTo(page, named(new RegExp(`^${t('uk', 'q.submit')}$`)), { label: 'Submit answer' });
    await page.keyboard.press('Enter');
    await page.locator('#block-basics-predict .question-result.result-ok').waitFor();
    await waitFor(async () => (await liveRegion(page).textContent()) === t('uk', 'q.correct'), { message: 'answer announced' });
    const afterSubmit = await focusInfo(page);
    assert.notEqual(afterSubmit.tag, 'BODY', 'submitting keeps keyboard focus in the question (the submit button disappears)');

    // The exercise: into the editor, type, leave with Esc then Tab, check.
    const editorInfo = await tabTo(page, (i) => i.editor, { label: 'code editor' });
    assert.match(editorInfo.name, new RegExp(t('uk', 'ws.editor', { file: 'index.js' })));
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.type('console.log(label, 3);');
    await tabTo(page, (i) => i.tag === 'BUTTON' && new RegExp(`^${t('uk', 'ws.check')}$`).test(i.name), { label: 'Check' });
    await page.keyboard.press('Enter');
    await page.locator('.tests-summary.tests-ok').waitFor({ timeout: 15_000 });
    assert.equal((await focusInfo(page)).name, t('uk', 'ws.check'), 'focus stays on Check while and after it checks');
    await waitFor(async () => (await liveRegion(page).textContent()) === t('uk', 'ws.passedAll'), { message: 'check result announced' });
    assert.match(await page.locator('.ws-status').innerText(), new RegExp(t('uk', 'ws.exercisePassed')));
    await tabTo(page, named(new RegExp(`^${t('uk', 'lesson.next')}$`)), { label: 'Next' });
    await page.keyboard.press('Enter');
    await page.locator('#block-basics-transfer').waitFor();

    // Page 3: the lesson is complete and says so.
    const done = page.locator('.lesson-done');
    await done.waitFor();
    assert.equal(await done.getAttribute('role'), 'status');
    assert.match(await done.innerText(), new RegExp(t('uk', 'lesson.completed')));
    await waitFor(async () => (await lab.doc('progress'))?.lessons?.[L1]?.state === 'completed', { message: 'completion stored' });
    // Shift+Tab walks back with visible focus as well.
    await tabTo(page, named(new RegExp(`^${t('uk', 'lesson.prev')}$`)), { back: true, label: 'Back' });
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('focusable learner content in a hidden result frame cannot capture keyboard focus', async () => {
  const lab = await Lab.start({ distDir });
  try {
    await lab.seed('profile', { language: 'uk', styleId: 'calm-studio', appearance: 'system', textSize: 'default', activeWorkspaceId: null, lastLesson: null, onboardingDone: true, createdAt: new Date().toISOString() });
    const { page, problems, context } = await openApp(browser, lab, { hash: `#/lesson/${L1}/1` });
    await page.locator('#block-basics-example').waitFor();
    // A JavaScript-only example has no page preview: its document stays off screen.
    await page.locator('.ws-editor .cm-content').click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText("const b = document.createElement('button');\nb.textContent = 'learner button';\ndocument.body.append(b);\nconsole.log('ready');\n");
    await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.run') }).click();
    await page.locator('.console').getByText('ready').waitFor();
    await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.run') }).focus();
    await tabTo(page, named(new RegExp(`^${t('uk', 'lesson.next')}$`)), { label: 'Next, past the result panel' });
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('the glossary popover opens by keyboard, closes with Escape and returns focus', async () => {
  const lab = await Lab.start({ distDir });
  try {
    await lab.seed('profile', { language: 'uk', styleId: 'calm-studio', appearance: 'system', textSize: 'default', activeWorkspaceId: null, lastLesson: null, onboardingDone: true, createdAt: new Date().toISOString() });
    const { page, problems, context } = await openApp(browser, lab, { hash: `#/lesson/${L1}/1` });
    await page.locator('#block-basics-intro').waitFor();
    await page.locator('.lesson').focus();
    const term = await tabTo(page, (i) => i.cls.includes('term') && i.name === 'інструкція', { label: 'glossary term' });
    assert.equal(term.tag, 'BUTTON');
    await page.keyboard.press('Enter');
    const popover = page.getByRole('dialog', { name: 'statement' });
    await popover.waitFor();
    assert.match(await popover.innerText(), /Один крок програми/);
    const anchor = page.locator('#block-basics-intro button.term').first();
    assert.equal(await anchor.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    await popover.waitFor({ state: 'detached' });
    assert.equal((await focusInfo(page)).name, 'інструкція', 'Escape returns focus to the term');
    assert.equal(await anchor.getAttribute('aria-expanded'), null);

    // Inside the popover (keyboard reachable, not a trap): its link is reachable, Escape returns.
    await page.keyboard.press('Enter');
    await popover.waitFor();
    await tabTo(page, (i) => i.tag === 'A' && i.name.startsWith(t('uk', 'term.more')), { max: 6, label: 'popover link' });
    await page.keyboard.press('Escape');
    await popover.waitFor({ state: 'detached' });
    assert.equal((await focusInfo(page)).name, 'інструкція');
    // Enter on the popover link opens the glossary entry.
    await page.keyboard.press('Enter');
    await popover.waitFor();
    await tabTo(page, (i) => i.tag === 'A' && i.name.startsWith(t('uk', 'term.more')), { max: 6, label: 'popover link' });
    await page.keyboard.press('Enter');
    await page.waitForURL(/#\/glossary\/statement$/);
    await page.locator('#term-statement.current').waitFor();
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});
