// Render smoke test: opens every page of the selected lessons in the real app (both languages)
// and fails on JavaScript errors, missing text or broken glossary links.
//   node scripts/content/smoke.mjs --unit JS-02      (needs `npm run build` first)
//   node scripts/content/smoke.mjs --unit JS-12 --locale uk-UA   (Chrome --lang + page locale)
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { startServer } from '../../server/app.mjs';
import { ROOT } from '../../server/config.mjs';
import { localeArg, localeOptions } from './browser-locale.mjs';

/**
 * First run of a fresh profile: choose a capstone, start, and wait until onboarding has finished —
 * the start creates the project (it loads the capstone and saves the workspace) and only then opens
 * the first lesson. Navigating before that lands on the onboarding screen, and its late navigation
 * to the first lesson replaces the address the smoke test asked for.
 */
export async function openCourse(page, url) {
  await page.goto(url);
  await page.locator('.capstone-card').first().click();
  await page.locator('.btn-large').click();
  await page.waitForURL(/#\/lesson\//, { timeout: 30_000 });
  await page.locator('.lesson[data-lesson]').waitFor({ timeout: 30_000 });
}

/** Open one lesson page and wait until exactly that lesson and page are rendered. Returns false on timeout. */
export async function visitLessonPage(page, url, id, pageNo, { timeout = 8000 } = {}) {
  await page.goto(`${url}#/lesson/${id}/${pageNo}`);
  return page.locator(`.lesson[data-lesson="${id}"][data-page="${pageNo}"]`).waitFor({ timeout }).then(() => true, () => false);
}

async function main() {
  const args = process.argv.slice(2);
  const values = (name) => args.flatMap((a, i) => (a === name && args[i + 1] ? args[i + 1].split(',') : []));
  const units = new Set(values('--unit').map((u) => u.toUpperCase()));
  const only = new Set(values('--lesson'));
  const locale = localeArg(args);
  const index = JSON.parse(await fs.readFile(path.join(ROOT, 'dist', 'content', 'index.json'), 'utf8'));
  const lessons = index.stages.flatMap((s) => s.units).flatMap((u) => u.lessons.filter((l) => l.authored && ((units.size === 0 && only.size === 0) || units.has(u.id) || only.has(l.id))));
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-smoke-'));
  const server = await startServer({ port: 0, dataDir, quiet: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, ...localeOptions(locale).launch });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...localeOptions(locale).page });
  const problems = [];
  let where = 'startup';
  page.on('pageerror', (e) => problems.push(`${where}: page error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) problems.push(`${where}: console error: ${m.text().slice(0, 200)}`); });
  await openCourse(page, server.url);
  let pages = 0;
  for (const lang of ['uk', 'en']) {
    await page.locator(`.lang-option[lang="${lang}"]`).click();
    await page.locator(`.lang-option[lang="${lang}"][aria-pressed="true"]`).waitFor();
    for (const lesson of lessons) {
      for (let p = 1; p <= lesson.pages; p++) {
        where = `${lesson.id} page ${p} (${lang})`;
        if (!(await visitLessonPage(page, server.url, lesson.id, p))) {
          // Say what is on screen instead: another lesson (a late navigation replaced the address),
          // another page, or no lesson at all (an error page, or still loading).
          const shown = await page.evaluate(() => ({ hash: location.hash, lesson: document.querySelector('.lesson[data-lesson]')?.dataset.lesson ?? null, page: document.querySelector('.lesson[data-page]')?.dataset.page ?? null, heading: document.querySelector('main h1')?.textContent?.trim().slice(0, 80) ?? null }));
          problems.push(`${where}: lesson did not render within 8 s (address ${shown.hash || '(none)'}; on screen: ${shown.lesson ? `${shown.lesson} page ${shown.page}` : `no lesson${shown.heading ? `, heading "${shown.heading}"` : ''}`})`);
        }
        await page.waitForTimeout(80);
        pages += 1;
        const report = await page.evaluate(() => ({
          blocks: document.querySelectorAll('.lesson .block').length,
          emptyProse: [...document.querySelectorAll('.lesson .prose')].filter((n) => n.textContent.trim() === '').length,
          rawLinks: (document.querySelector('.lesson')?.textContent.match(/\[\[[a-z0-9-]+/g) ?? []).length,
          placeholders: (document.querySelector('.lesson')?.textContent.match(/%%[a-zA-Z0-9_]+%%/g) ?? []).length,
          overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        }));
        if (report.blocks === 0) problems.push(`${where}: no blocks rendered`);
        if (report.emptyProse > 0) problems.push(`${where}: ${report.emptyProse} empty text block(s)`);
        if (report.rawLinks > 0) problems.push(`${where}: unrendered [[glossary]] link`);
        if (report.placeholders > 0) problems.push(`${where}: unresolved %%placeholder%% visible`);
        if (report.overflow) problems.push(`${where}: horizontal page overflow`);
      }
    }
  }
  await browser.close();
  await server.close();
  await fs.rm(dataDir, { recursive: true, force: true });
  for (const p of problems) console.error(`✖ ${p}`);
  console.log(`${problems.length === 0 ? 'SMOKE OK' : 'SMOKE FAILED'}${locale ? ` (locale ${locale})` : ''}: ${lessons.length} lesson(s), ${pages} page view(s), ${problems.length} problem(s)`);
  process.exit(problems.length === 0 ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
