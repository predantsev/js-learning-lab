// Review, glossary and settings pages: basic flows (REQ-007 delayed review, REQ-017 glossary,
// REQ-015/REQ-035 settings), including keyboard use of the settings radio groups.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, L2, Lab, buildFixtureDist, launchChrome, openApp, t, waitFor, waitSaved } from './helpers.mjs';

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

test('review: answered retrieval questions come back; due items are counted; practice records the next date', async () => {
  const lab = await Lab.start({ distDir });
  try {
    await lab.seed('profile', PROFILE);
    const { page, problems, context } = await openApp(browser, lab, { hash: `#/lesson/${L2}/1` });
    const review = page.locator('#block-practice-review');
    await review.waitFor();
    // Retrieval questions are asked without showing the answer first.
    assert.doesNotMatch(await review.innerText(), new RegExp(t('uk', 'q.correctAnswer')));
    const items = review.locator('.review-item');
    await items.nth(0).getByRole('textbox', { name: t('uk', 'q.yourAnswer') }).fill('5');
    await items.nth(0).getByRole('button', { name: t('uk', 'q.submit') }).click();
    await items.nth(0).locator('.result-ok').waitFor();
    await items.nth(1).locator('input[type=radio]').nth(1).check();
    await items.nth(1).getByRole('button', { name: t('uk', 'q.submit') }).click();
    await items.nth(1).locator('.result-no').waitFor();
    assert.match(await items.nth(1).innerText(), /Слово без лапок — це назва/, 'the chosen wrong option explains itself');
    assert.ok(await items.nth(0).getByRole('link', { name: t('uk', 'q.from', { lesson: 'Фікстура: інструкції та вивід' }) }).isVisible(), 'links to the earlier lesson');
    await waitSaved(page);
    const doc = await lab.doc('review');
    assert.deepEqual(Object.keys(doc.items).sort(), [`${L2}#practice-review/recall-quotes`, `${L2}#practice-review/recall-sum`]);

    await page.goto(lab.url('#/review'));
    await page.getByText(t('uk', 'review.due', { n: 0 })).waitFor();
    assert.match(await page.locator('.page').innerText(), new RegExp(t('uk', 'review.all', { n: 2 }).replace(/[()]/g, '\\$&')));
    await page.getByRole('button', { name: t('uk', 'review.practiceAll') }).click();
    const queue = page.locator('.review-queue > li');
    await waitFor(async () => (await queue.count()) === 2, { message: 'both questions offered' });
    const sumCard = queue.filter({ hasText: '2 + 3' });
    await sumCard.getByRole('textbox', { name: t('uk', 'q.yourAnswer') }).fill('5');
    await sumCard.getByRole('button', { name: t('uk', 'q.submit') }).click();
    await sumCard.getByText(new RegExp(t('uk', 'review.nextAt', { date: '' }).trim())).waitFor();
    await waitSaved(page);
    const item = (await lab.doc('review')).items[`${L2}#practice-review/recall-sum`];
    assert.equal(item.attempts, 2);
    assert.ok(new Date(item.nextAt) > new Date(), 'the next review is in the future');

    // A question that is due (seeded in the past) is offered without "practice all", and counted.
    await context.close();
    const due = { ...(await lab.doc('review')) };
    due.items[`${L2}#practice-review/recall-quotes`] = { ...due.items[`${L2}#practice-review/recall-quotes`], nextAt: '2026-01-01T00:00:00.000Z' };
    await lab.seed('review', due);
    const second = await openApp(browser, lab, { hash: '#/review' });
    await second.page.getByText(t('uk', 'review.due', { n: 1 })).waitFor();
    assert.equal(await second.page.locator('.review-queue > li').count(), 1);
    assert.match(await second.page.locator('.app-sidebar').innerText(), new RegExp(t('uk', 'nav.reviewDue', { n: 1 })));
    assert.deepEqual([...problems, ...second.problems], []);
    await second.context.close();
  } finally {
    await lab.dispose();
  }
});

test('glossary: list, search by term, local name and alias, see-also links and deep links land on the term', async () => {
  const lab = await Lab.start({ distDir });
  try {
    await lab.seed('profile', PROFILE);
    const { page, problems, context } = await openApp(browser, lab, { hash: '#/glossary', viewport: { width: 1280, height: 800 } });
    const items = page.locator('.glossary-item');
    await items.first().waitFor();
    assert.equal(await items.count(), 11);
    const search = page.getByRole('searchbox', { name: t('uk', 'glossary.search') });
    await search.fill('вивід');
    await waitFor(async () => (await items.count()) === 1, { message: 'search by Ukrainian name' });
    assert.match(await items.first().innerText(), /output/);
    await search.fill('print');
    await waitFor(async () => (await items.count()) === 1 && /output/.test(await items.first().innerText()), { message: 'search by alias' });
    await search.fill('stat');
    await waitFor(async () => (await items.count()) === 1 && /statement/.test(await items.first().innerText()), { message: 'search by term' });
    await search.fill('zzz');
    await page.getByText(t('uk', 'glossary.empty')).waitFor();
    await search.fill('');
    await waitFor(async () => (await items.count()) === 11, { message: 'all terms back' });
    assert.match(await page.locator('#term-output').innerText(), /console\.log\(1 \+ 1\)/, 'the visual example is shown');

    // A deep link (as from a lesson popover) lands on its term, even below the fold.
    await page.goto(lab.url('#/glossary/zebra-term'));
    const target = page.locator('#term-zebra-term.current');
    await target.waitFor();
    await waitFor(() => target.evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), { message: 'the linked term is scrolled into view' });
    assert.ok(await target.evaluate((el) => el === document.activeElement), 'the linked term receives focus');
    // "See also" links between terms.
    await page.goto(lab.url('#/glossary/statement'));
    await page.locator('#term-statement').getByRole('link', { name: 'output' }).click();
    await page.locator('#term-output.current').waitFor();
    // An unknown term id explains itself instead of silently showing the list.
    await page.goto(lab.url('#/glossary/no-such-term'));
    await page.getByRole('status').filter({ hasText: t('uk', 'term.missing') }).waitFor();
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('settings: language, style, appearance and text size apply at once, persist, and work with arrow keys', async () => {
  const lab = await Lab.start({ distDir });
  try {
    await lab.seed('profile', PROFILE);
    const { page, problems, context } = await openApp(browser, lab, { hash: '#/settings' });
    const html = page.locator('html');
    const rootSize = () => page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    const group = (name) => page.getByRole('radiogroup', { name });

    // Text size by keyboard: one tab stop per group, arrows move and select.
    const sizes = group(t('uk', 'settings.textSize'));
    const checked = sizes.getByRole('radio', { checked: true });
    assert.equal(await checked.innerText(), t('uk', 'settings.textSize.default'));
    assert.deepEqual(await sizes.getByRole('radio').evaluateAll((els) => els.map((e) => e.tabIndex)), [-1, 0, -1], 'only the selected option is a tab stop');
    await checked.focus();
    assert.equal(await rootSize(), '16px');
    await page.keyboard.press('ArrowRight');
    assert.equal(await html.getAttribute('data-text-size'), 'large');
    assert.equal(await rootSize(), '18px');
    assert.equal(await page.evaluate(() => document.activeElement?.textContent), t('uk', 'settings.textSize.large'), 'focus follows the selection');
    await page.keyboard.press('ArrowRight');
    assert.equal(await html.getAttribute('data-text-size'), 'compact', 'arrows wrap around');
    assert.equal(await rootSize(), '15px');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await html.getAttribute('data-text-size'), null, 'back to the default size');

    // Language from the settings page; the whole interface follows.
    await group(t('uk', 'settings.language')).getByRole('radio', { name: t('uk', 'lang.en') }).click();
    await page.getByRole('heading', { level: 1, name: t('en', 'settings.title') }).waitFor();
    assert.equal(await html.getAttribute('lang'), 'en');
    assert.equal(await page.locator('.lang-switch button[aria-pressed="true"]').innerText(), 'EN', 'the top bar agrees');
    await group(t('en', 'settings.style')).getByRole('radio', { name: t('en', 'settings.style.editorial') }).click();
    await group(t('en', 'settings.appearance')).getByRole('radio', { name: t('en', 'settings.appearance.dark') }).click();
    await group(t('en', 'settings.textSize')).getByRole('radio', { name: t('en', 'settings.textSize.large') }).click();
    await waitSaved(page);
    assert.deepEqual(
      (({ language, styleId, appearance, textSize }) => ({ language, styleId, appearance, textSize }))(await lab.doc('profile')),
      { language: 'en', styleId: 'editorial', appearance: 'dark', textSize: 'large' },
    );
    // The data section names where the learner's files live; the about section the versions.
    assert.match(await page.locator('.settings').innerText(), new RegExp(lab.dataDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});
