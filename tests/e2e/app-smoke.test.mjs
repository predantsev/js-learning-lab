// Smoke test on the real course build (dist/content from `npm run build`), not the fixtures:
// onboarding → the first authored lesson renders, its first example runs for real, its first
// exercise can be checked, and the course map lists the whole planned course. Driven by the
// compiled index, so it keeps working as lessons are authored.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { Lab, ROOT, assertBuilt, launchChrome, onboard, openApp, t } from './helpers.mjs';

let browser;
before(async () => {
  await assertBuilt();
  browser = await launchChrome();
});
after(async () => {
  await browser?.close();
});

const readJson = async (rel) => JSON.parse(await fs.readFile(path.join(ROOT, 'dist', 'content', rel), 'utf8'));

test('real content: onboarding, the first lesson, a real run, a check and the full course map', async () => {
  const index = await readJson('index.json');
  const planned = index.stages.flatMap((s) => s.units).flatMap((u) => u.lessons);
  const first = planned.find((l) => l.authored);
  assert.ok(first, 'the build contains at least one authored lesson');
  const lesson = await readJson(`lessons/${first.id}.json`);
  const byId = new Map(lesson.blocks.map((b) => [b.id, b]));
  const pageOf = (kind) => lesson.pages.findIndex((ids) => ids.some((id) => byId.get(id).kind === kind));

  const lab = await Lab.start();
  try {
    const { page, problems, context } = await openApp(browser, lab, { viewport: { width: 1280, height: 800 } });
    await onboard(page, index.capstones[0].title.uk);
    await page.waitForURL(new RegExp(`#/lesson/${first.id}/1$`));
    assert.equal((await page.locator('#lesson-title').innerText()).trim(), lesson.title.uk);
    assert.equal(await page.locator('.chip-steps').innerText(), t('uk', 'lesson.page', { n: 1, total: lesson.pages.length }));

    const examplePage = pageOf('example');
    if (examplePage >= 0) {
      const example = lesson.pages[examplePage].map((id) => byId.get(id)).find((b) => b.kind === 'example');
      await page.goto(lab.url(`#/lesson/${first.id}/${examplePage + 1}`));
      await page.locator(`#block-${example.id}`).waitFor();
      await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.run'), exact: true }).click();
      await page.locator('.ws-status.ws-status-done').waitFor({ timeout: 15_000 });
      assert.equal((await page.locator('.ws-status').innerText()).trim(), t('uk', example.expectError ? 'ws.finishedErrors' : 'ws.finished'));
    }
    const exercisePage = pageOf('exercise');
    if (exercisePage >= 0) {
      const exercise = lesson.pages[exercisePage].map((id) => byId.get(id)).find((b) => b.kind === 'exercise');
      await page.goto(lab.url(`#/lesson/${first.id}/${exercisePage + 1}`));
      await page.locator(`#block-${exercise.id}`).waitFor();
      await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.check'), exact: true }).click();
      await page.locator('.tests-summary').waitFor({ timeout: 15_000 });
      const titles = await page.locator('.test-title').allTextContents();
      assert.equal(titles.length, Object.keys(exercise.testTitles).length, 'every check is listed with its title');
      for (const title of titles) assert.doesNotMatch(title, /<\/?p>/, 'check titles are text, not raw markup');
    }

    await page.goto(lab.url('#/course'));
    await page.locator('.unit-card').first().waitFor();
    assert.equal(await page.locator('.unit-card .lesson-row').count(), planned.length, 'the course map lists every planned lesson');
    assert.equal(await page.locator('.unit-card .lesson-row.disabled').count(), planned.filter((l) => !l.authored).length, 'unpublished lessons are marked');
    assert.deepEqual(index.stages.map((s) => s.id), ['JS', 'RE', 'RN', 'NO'], 'one course in the required order');
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});
