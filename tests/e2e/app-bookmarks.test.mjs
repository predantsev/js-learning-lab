// V-10 / REQ-020: bookmark an explanation, an example and an exercise; after a restart the
// bookmarks page opens each exact block; removal persists; moved (redirected) and missing targets
// keep the bookmark with understandable guidance.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, L2, Lab, buildFixtureDist, exact, launchChrome, onboard, openApp, t, waitFor, waitSaved } from './helpers.mjs';

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

const star = (page, blockId) => page.locator(`#block-${blockId} .block-actions button`).nth(1);
const bookmarkRow = (page, text) => page.locator('.bookmark').filter({ hasText: text });

async function expectLandedOn(page, lessonId, blockId, pageNo) {
  await page.waitForURL(new RegExp(`#/lesson/${lessonId}/1\\?block=${blockId}$`));
  await page.locator(`#block-${blockId}`).waitFor();
  await waitFor(() => page.evaluate((id) => document.activeElement?.id === `block-${id}`, blockId), { message: `focus on block ${blockId}` });
  const box = await page.locator(`#block-${blockId}`).boundingBox();
  const viewport = page.viewportSize();
  assert.ok(box && box.y >= 0 && box.y < viewport.height, `block ${blockId} is scrolled into view (y=${box?.y})`);
  assert.match(await page.locator('.chip-steps').innerText(), new RegExp(`\\b${pageNo}\\b`), `the page that contains ${blockId}`);
}

test('bookmarked explanation, example and exercise open at the exact block after a restart; removal persists', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const first = await openApp(browser, lab);
    const { page } = first;
    await onboard(page);
    await star(page, 'basics-intro').click();
    assert.equal(await star(page, 'basics-intro').getAttribute('aria-pressed'), 'true');
    assert.equal(await star(page, 'basics-intro').getAttribute('aria-label'), t('uk', 'block.unbookmark'));
    await waitFor(async () => (await page.locator('.app > [role="status"]').textContent()) === t('uk', 'block.bookmarked'), { message: 'bookmark announced' });
    await star(page, 'basics-example').click();
    await page.locator('.pager').getByRole('button', { name: t('uk', 'lesson.next') }).click();
    await page.locator('#block-basics-exercise').waitFor();
    await star(page, 'basics-exercise').click();
    await waitSaved(page);
    assert.deepEqual((await lab.doc('bookmarks')).items.map((b) => `${b.lessonId}#${b.blockId}`), [`${L1}#basics-intro`, `${L1}#basics-example`, `${L1}#basics-exercise`]);
    await first.context.close();

    await lab.restart();
    const second = await openApp(browser, lab, { hash: '#/bookmarks' });
    const p2 = second.page;
    await p2.locator('.bookmark').first().waitFor();
    assert.equal(await p2.locator('.bookmark').count(), 3);
    assert.match(await bookmarkRow(p2, 'Інструкції виконуються по черзі').innerText(), new RegExp(t('uk', 'block.explanation')));
    assert.match(await bookmarkRow(p2, 'Запусти приклад').innerText(), new RegExp(t('uk', 'block.example')));
    assert.match(await bookmarkRow(p2, 'Виведи назву й число').innerText(), new RegExp(t('uk', 'block.exercise')));

    for (const [blockId, text, pageNo] of [['basics-intro', 'Інструкції виконуються по черзі', 1], ['basics-example', 'Запусти приклад', 1], ['basics-exercise', 'Виведи назву й число', 2]]) {
      await p2.goto(lab.url('#/bookmarks'));
      await bookmarkRow(p2, text).getByRole('link', { name: t('uk', 'bookmarks.open') }).click();
      await expectLandedOn(p2, L1, blockId, pageNo);
    }

    await p2.goto(lab.url('#/bookmarks'));
    await bookmarkRow(p2, 'Запусти приклад').getByRole('button', { name: t('uk', 'bookmarks.remove') }).click();
    await waitFor(async () => (await p2.locator('.bookmark').count()) === 2, { message: 'bookmark removed' });
    await waitSaved(p2);
    await second.context.close();
    await lab.restart();
    const third = await openApp(browser, lab, { hash: '#/bookmarks' });
    await third.page.locator('.bookmark').first().waitFor();
    assert.equal(await third.page.locator('.bookmark').count(), 2);
    assert.equal(await bookmarkRow(third.page, 'Запусти приклад').count(), 0);
    // The star on the block reflects the removal.
    await third.page.goto(lab.url(`#/lesson/${L1}/1`));
    await third.page.locator('#block-basics-example').waitFor();
    assert.equal(await star(third.page, 'basics-example').getAttribute('aria-pressed'), 'false');
    assert.equal(await star(third.page, 'basics-intro').getAttribute('aria-pressed'), 'true');
    assert.deepEqual([...first.problems, ...second.problems, ...third.problems], []);
    await third.context.close();
  } finally {
    await lab.dispose();
  }
});

test('moved and missing bookmark targets keep the bookmark with guidance; redirects open the new place', async () => {
  const lab = await Lab.start({ distDir });
  try {
    // Bookmarks created under an older content version (ids that moved or disappeared since).
    await lab.seed('profile', { language: 'uk', styleId: 'calm-studio', appearance: 'system', textSize: 'default', activeWorkspaceId: null, lastLesson: null, onboardingDone: true, createdAt: '2026-09-01T00:00:00.000Z' });
    const items = [
      { id: 'old-1', lessonId: L1, blockId: 'basics-old-intro', createdAt: '2026-09-01T00:00:00.000Z' },
      { id: 'old-2', lessonId: 'js-01-00-fixture-retired', blockId: 'practice-intro', createdAt: '2026-09-01T00:00:00.000Z' },
      { id: 'old-3', lessonId: L1, blockId: 'basics-removed', createdAt: '2026-09-01T00:00:00.000Z' },
      { id: 'old-4', lessonId: 'js-01-09-fixture-gone', blockId: 'gone-block', createdAt: '2026-09-01T00:00:00.000Z' },
    ];
    await lab.seed('bookmarks', { items });
    const { page, problems, context } = await openApp(browser, lab, { hash: '#/bookmarks' });
    await page.locator('.bookmark').first().waitFor();
    assert.equal(await page.locator('.bookmark').count(), 4, 'every bookmark is kept');

    const moved = page.locator('.bookmark').nth(0);
    assert.match(await moved.innerText(), new RegExp(t('uk', 'bookmarks.moved')));
    assert.match(await moved.innerText(), /Інструкції виконуються по черзі/, 'shows the new target');
    const movedLesson = page.locator('.bookmark').nth(1);
    assert.match(await movedLesson.innerText(), new RegExp(t('uk', 'bookmarks.moved')));
    assert.match(await movedLesson.innerText(), /Фікстура: практика й повторення/);

    const missingBlock = page.locator('.bookmark').nth(2);
    assert.match(await missingBlock.innerText(), new RegExp(t('uk', 'bookmarks.missing').slice(0, 40)));
    assert.equal(await missingBlock.getByRole('link', { name: t('uk', 'bookmarks.open') }).count(), 0);
    assert.ok(await missingBlock.getByRole('link', { name: t('uk', 'bookmarks.openLesson') }).isVisible(), 'the lesson still exists and can be opened');
    const missingLesson = page.locator('.bookmark').nth(3);
    assert.match(await missingLesson.innerText(), new RegExp(t('uk', 'bookmarks.missing').slice(0, 40)));
    assert.match(await missingLesson.innerText(), /js-01-09-fixture-gone/, 'the bookmark is still identifiable');
    assert.ok(await missingLesson.getByRole('button', { name: t('uk', 'bookmarks.remove') }).isVisible());

    // Redirected targets open the new place.
    await moved.getByRole('link', { name: exact('uk', 'bookmarks.open') }).click();
    await expectLandedOn(page, L1, 'basics-intro', 1);
    await page.goto(lab.url('#/bookmarks'));
    await page.locator('.bookmark').nth(1).getByRole('link', { name: exact('uk', 'bookmarks.open') }).click();
    await expectLandedOn(page, L2, 'practice-intro', 1);
    // The missing-block bookmark opens its lesson.
    await page.goto(lab.url('#/bookmarks'));
    await page.locator('.bookmark').nth(2).getByRole('link', { name: t('uk', 'bookmarks.openLesson') }).click();
    await page.waitForURL(new RegExp(`#/lesson/${L1}/1$`));
    await page.locator('#block-basics-intro').waitFor();
    // Nothing was dropped or rewritten on the way.
    assert.deepEqual((await lab.doc('bookmarks')).items, items);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});
