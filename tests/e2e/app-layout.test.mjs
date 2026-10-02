// REQ-011 / REQ-030 (layout part): at the minimum supported viewport 1280×800 and at 1440×900 the
// lesson shows explanation and practice side by side, with a usable editor and result, and no
// horizontal page scroll — in all three styles, before and after running code.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, L2, Lab, buildFixtureDist, launchChrome, openApp, t } from './helpers.mjs';

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

const measure = (page) => page.evaluate(() => {
  const box = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
  const main = document.querySelector('.app-main');
  return {
    viewport: { width: innerWidth, height: innerHeight },
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    mainOverflow: main.scrollWidth - main.clientWidth,
    topOverflow: document.querySelector('.app-top').scrollWidth - document.querySelector('.app-top').clientWidth,
    left: box('.lesson-left'),
    right: box('.lesson-right'),
    editor: box('.ws-editor .cm-editor'),
    result: box('.ws-result'),
    resultBody: box('.ws-result .result-body'),
    narrowNotice: [...document.querySelectorAll('.banner')].some((b) => b.textContent.includes('1280')),
  };
});

for (const viewport of [{ width: 1280, height: 800 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}×${viewport.height}: explanation and practice side by side, usable editor and result, no horizontal scroll`, async () => {
    const lab = await Lab.start({ distDir });
    try {
      await lab.seed('profile', { language: 'uk', styleId: 'calm-studio', appearance: 'system', textSize: 'default', activeWorkspaceId: null, lastLesson: null, onboardingDone: true, createdAt: '2026-10-01T00:00:00.000Z' });
      const { page, problems, context } = await openApp(browser, lab, { hash: `#/lesson/${L1}/1`, viewport });
      const report = [];
      for (const style of ['calm-studio', 'editorial', 'dev-workspace']) {
        // Choose the style the way a learner does, so it is the stored preference.
        await page.goto(lab.url('#/settings'));
        await page.getByRole('radio', { name: t('uk', `settings.style.${style}`), exact: true }).click();
        for (const [lesson, pageNo, block] of [[L1, 1, 'basics-example'], [L1, 2, 'basics-exercise'], [L2, 1, 'practice-debug']]) {
          await page.goto(lab.url(`#/lesson/${lesson}/${pageNo}`));
          await page.locator(`#block-${block}`).waitFor();
          assert.equal(await page.locator('html').getAttribute('data-style'), style, 'measuring in the chosen style');
          // Run the code so the result panel holds real output.
          await page.locator('.ws-actions').getByRole('button', { name: t('uk', 'ws.run'), exact: true }).click();
          await page.locator('.ws-status.ws-status-done').waitFor();
          const m = await measure(page);
          const where = `${style} ${lesson} p${pageNo}`;
          report.push(`${where}: left ${Math.round(m.left.width)}px, editor ${Math.round(m.editor.width)}×${Math.round(m.editor.height)}, result top ${Math.round(m.result.top)}`);
          assert.ok(m.pageOverflow <= 0, `${where}: no horizontal page scroll (${m.pageOverflow}px)`);
          assert.ok(m.mainOverflow <= 0, `${where}: no horizontal scroll in the content area (${m.mainOverflow}px)`);
          assert.ok(m.topOverflow <= 0, `${where}: the top bar fits (${m.topOverflow}px)`);
          assert.equal(m.narrowNotice, false, `${where}: no "screen too narrow" notice at a supported size`);
          assert.ok(m.right.left >= m.left.right - 1, `${where}: practice is beside the explanation, not below it`);
          assert.ok(m.left.width >= 320, `${where}: explanation column is readable (${m.left.width}px)`);
          assert.ok(m.editor.width >= 420 && m.editor.height >= 120, `${where}: editor is usable (${m.editor.width}×${m.editor.height})`);
          assert.ok(m.right.right <= m.viewport.width, `${where}: practice column ends inside the window`);
          assert.ok(m.result.top < m.viewport.height - 100, `${where}: the result panel is visible next to the editor without scrolling (top ${m.result.top})`);
          assert.ok(m.resultBody.width >= 420, `${where}: result area is usable (${m.resultBody.width}px)`);
        }
      }
      console.log(report.join('\n'));
      assert.deepEqual(problems, []);
      await context.close();
    } finally {
      await lab.dispose();
    }
  });
}
