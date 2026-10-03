// The content smoke test (scripts/content/smoke.mjs) waits for the application before its first
// lesson view: a slow first project start (cold capstone files right after a build) must not turn
// into "lesson did not render".
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { openCourse, visitLessonPage } from '../../scripts/content/smoke.mjs';
import { L1, L2, Lab, buildFixtureDist, launchChrome } from './helpers.mjs';

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

/** A page whose capstone files answer slowly, like the first request after a build on a busy machine. */
async function slowStartPage() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.route('**/content/capstones/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  return { page, context };
}

test('the race: navigating right after "Start" is overridden by the onboarding\'s own late navigation', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, context } = await slowStartPage();
    await page.goto(lab.url());
    await page.locator('.capstone-card').first().click();
    await page.locator('.btn-large').click();
    // What the smoke test used to do: go to the lesson at once.
    await page.goto(lab.url(`#/lesson/${L2}/1`));
    await page.waitForURL(new RegExp(`#/lesson/${L1}/`), { timeout: 10_000 });
    assert.equal(await page.locator(`.lesson[data-lesson="${L2}"]`).count(), 0, 'the requested lesson was replaced by the first lesson');
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('openCourse waits for the project start, so the first lesson view is the one requested', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, context } = await slowStartPage();
    await openCourse(page, lab.url());
    assert.equal(await visitLessonPage(page, lab.url(), L2, 1), true);
    assert.equal(await visitLessonPage(page, lab.url(), L2, 2), true, 'the page number is part of the wait');
    assert.match(page.url(), new RegExp(`#/lesson/${L2}/2$`));
    await context.close();
  } finally {
    await lab.dispose();
  }
});
