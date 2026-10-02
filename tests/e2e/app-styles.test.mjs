// V-17 / REQ-035: fresh data starts in Calm Studio; switching through the three style ids and the
// appearance modes changes presentation only (code, drafts, page, language, progress, hints and
// bookmarks stay), works in every style, survives a restart; unknown, retired or missing style ids
// fall back to Calm Studio without losing other data.
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

const STYLES = ['calm-studio', 'editorial', 'dev-workspace'];
const html = (page) => page.locator('html');
const bodyBackground = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const radio = (page, lang, key) => page.getByRole('radio', { name: t(lang, key), exact: true });

test('Calm Studio by default; every style and appearance keeps all learner state and works', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    assert.equal(await html(page).getAttribute('data-style'), 'calm-studio', 'fresh data starts in Calm Studio');
    assert.equal(await html(page).getAttribute('data-appearance'), null, 'appearance follows the system by default');
    await onboard(page);

    // Learner state worth losing: code, a revealed hint, a bookmark, an answer, English interface.
    await page.locator('.pager').getByRole('button', { name: t('uk', 'lesson.next') }).click();
    const exercise = page.locator('#block-basics-exercise');
    await exercise.waitFor();
    const code = "import { label } from './label.js';\nconsole.log(label, 'style-proof');\n";
    await replaceEditor(page, code);
    await exercise.getByRole('button', { name: t('uk', 'hint.need') }).click();
    await exercise.getByText('ФІКСТУРА-НАТЯК-1').waitFor();
    await page.locator('#block-basics-exercise .block-actions button').nth(1).click();
    const predict = page.locator('#block-basics-predict');
    await predict.locator('input[type=radio]').first().check();
    await predict.getByRole('button', { name: t('uk', 'q.submit') }).click();
    await page.locator('.lang-switch').getByRole('button', { name: 'EN', exact: true }).click();
    await waitSaved(page);
    const before = { progress: await lab.doc('progress'), drafts: await lab.doc(`drafts/${L1}`), bookmarks: await lab.doc('bookmarks') };

    const backgrounds = new Set();
    for (const style of [...STYLES.slice(1), STYLES[0]]) {
      for (const appearance of ['dark', 'light', 'system']) {
        await page.goto(lab.url('#/settings'));
        await radio(page, 'en', `settings.style.${style}`).click();
        await radio(page, 'en', `settings.appearance.${appearance}`).click();
        assert.equal(await html(page).getAttribute('data-style'), style);
        assert.equal(await html(page).getAttribute('data-appearance'), appearance === 'system' ? null : appearance);
        assert.equal(await radio(page, 'en', `settings.style.${style}`).getAttribute('aria-checked'), 'true');
        backgrounds.add(`${style}/${appearance}:${await bodyBackground(page)}`);
        assert.equal(await html(page).getAttribute('lang'), 'en', 'the interface language is untouched');

        // Back to the lesson: same page, same code, same revealed hint, same bookmark.
        await page.goBack();
        await exercise.waitFor();
        assert.match(await page.locator('.chip-steps').innerText(), /2/);
        assert.equal(await editorText(page), code);
        assert.ok(await exercise.getByText('FIXTURE-HINT-1').isVisible(), 'the revealed hint stays revealed');
        assert.equal(await page.locator('#block-basics-exercise .block-actions button').nth(1).getAttribute('aria-pressed'), 'true');
      }
      // Functional parity in this style: run real code and translate a block in place.
      await page.goto(lab.url(`#/lesson/${L1}/1`));
      await page.locator('.ws-actions').getByRole('button', { name: t('en', 'ws.run'), exact: true }).click();
      await page.locator('.console').getByText('Hello from the fixture').waitFor();
      await page.locator('#block-basics-intro .block-actions button').first().click();
      await page.locator('#block-basics-intro h2', { hasText: 'Інструкції виконуються по черзі' }).waitFor();
      await page.locator('#block-basics-intro .block-actions button').first().click();
      await page.locator('#block-basics-intro h2', { hasText: 'Statements run in order' }).waitFor();
      await page.goto(lab.url(`#/lesson/${L1}/2`));
      await exercise.waitFor();
    }
    // Presentation really changed: every style × appearance has its own background color
    // (system resolves to light in this browser context).
    const colors = (style) => [...backgrounds].filter((b) => b.startsWith(`${style}/`)).map((b) => b.split(':')[1]);
    for (const style of STYLES) {
      const [dark, light, system] = colors(style);
      assert.notEqual(dark, light, `${style}: dark differs from light`);
      assert.equal(system, light, `${style}: system follows the light browser scheme`);
    }
    assert.equal(new Set(STYLES.map((s) => colors(s)[1])).size, 3, 'the three styles look different');

    await waitSaved(page);
    const afterSwitching = { progress: await lab.doc('progress'), drafts: await lab.doc(`drafts/${L1}`), bookmarks: await lab.doc('bookmarks') };
    assert.deepEqual(afterSwitching.bookmarks, before.bookmarks);
    assert.equal(afterSwitching.drafts.blocks['basics-exercise'].files['index.js'], code);
    const ex = afterSwitching.progress.lessons[L1];
    assert.ok(ex.exercises['basics-exercise'].hintNudgeAt);
    assert.deepEqual(ex.questions, before.progress.lessons[L1].questions, 'answers unchanged');
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('the chosen style and appearance survive a restart', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const first = await openApp(browser, lab);
    await onboard(first.page);
    await first.page.goto(lab.url('#/settings'));
    await radio(first.page, 'uk', 'settings.style.dev-workspace').click();
    await radio(first.page, 'uk', 'settings.appearance.dark').click();
    await waitSaved(first.page);
    assert.equal((await lab.doc('profile')).styleId, 'dev-workspace');
    await first.context.close();
    await lab.restart();
    const second = await openApp(browser, lab, { hash: '' });
    assert.equal(await html(second.page).getAttribute('data-style'), 'dev-workspace');
    assert.equal(await html(second.page).getAttribute('data-appearance'), 'dark');
    await second.page.goto(lab.url('#/settings'));
    assert.equal(await radio(second.page, 'uk', 'settings.style.dev-workspace').getAttribute('aria-checked'), 'true');
    assert.deepEqual([...first.problems, ...second.problems], []);
    await second.context.close();
  } finally {
    await lab.dispose();
  }
});

test('unknown, retired or missing style ids fall back to Calm Studio without losing other data', async () => {
  for (const styleId of ['retro-neon', 'calm', null]) {
    const lab = await Lab.start({ distDir });
    try {
      const profile = { language: 'en', appearance: 'dark', textSize: 'large', activeWorkspaceId: null, lastLesson: { id: L1, page: 1 }, onboardingDone: true, createdAt: '2026-09-01T00:00:00.000Z', ...(styleId === null ? {} : { styleId }) };
      const drafts = { blocks: { 'basics-exercise': { files: { 'index.js': '// kept\n', 'label.js': 'export const label = "x";\n' }, lang: 'en', updatedAt: '2026-09-01T00:00:00.000Z' } } };
      const bookmarks = { items: [{ id: 'b1', lessonId: L1, blockId: 'basics-intro', createdAt: '2026-09-01T00:00:00.000Z' }] };
      await lab.seed('profile', profile);
      await lab.seed(`drafts/${L1}`, drafts);
      await lab.seed('bookmarks', bookmarks);
      const { page, problems, context } = await openApp(browser, lab, { hash: '' });
      assert.equal(await html(page).getAttribute('data-style'), 'calm-studio', `${styleId} → calm-studio`);
      assert.equal(await html(page).getAttribute('lang'), 'en', 'language kept');
      assert.equal(await html(page).getAttribute('data-appearance'), 'dark', 'appearance kept');
      assert.equal(await html(page).getAttribute('data-text-size'), 'large', 'text size kept');
      assert.match(await page.getByRole('link', { name: new RegExp(t('en', 'nav.continue')) }).getAttribute('href'), new RegExp(`#/lesson/${L1}/2$`), 'position kept');
      await page.goto(lab.url('#/settings'));
      assert.equal(await radio(page, 'en', 'settings.style.calm-studio').getAttribute('aria-checked'), 'true');
      assert.deepEqual(await lab.doc(`drafts/${L1}`), drafts);
      assert.deepEqual(await lab.doc('bookmarks'), bookmarks);
      // The next preference change stores the migrated id; everything else in the profile stays.
      await radio(page, 'en', 'settings.textSize.default').click();
      await waitFor(async () => (await lab.doc('profile')).styleId === 'calm-studio', { message: 'migrated style id stored' });
      const stored = await lab.doc('profile');
      assert.equal(stored.language, 'en');
      assert.deepEqual(stored.lastLesson, profile.lastLesson);
      assert.deepEqual(problems, []);
      await context.close();
    } finally {
      await lab.dispose();
    }
  }
});
