// How the lesson workspace shows what the runner reports about a program (issue #7 author reports):
// console.trace output, error causes and module-linking guidance, in both languages.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, Lab, buildFixtureDist, launchChrome, openApp, replaceEditor, t } from './helpers.mjs';

let distDir;
let browser;
let lab;
before(async () => {
  distDir = await buildFixtureDist();
  browser = await launchChrome();
  lab = await Lab.start({ distDir });
  await lab.seed('profile', { language: 'uk', styleId: 'calm-studio', appearance: 'system', textSize: 'default', activeWorkspaceId: null, lastLesson: null, onboardingDone: true, createdAt: '2026-10-01T00:00:00.000Z' });
});
after(async () => {
  await browser?.close();
  await lab?.dispose();
  await fs.rm(distDir, { recursive: true, force: true });
});

/** Open the first fixture example, type `code` into its editor, run it and wait for the result. */
async function runInExample(code, { lang = 'uk' } = {}) {
  const session = await openApp(browser, lab, { hash: `#/lesson/${L1}/1` });
  const { page } = session;
  await page.locator('#block-basics-example').waitFor();
  if (lang === 'en') await page.locator('.lang-switch').getByRole('button', { name: 'EN', exact: true }).click();
  await replaceEditor(page, code);
  await page.locator('.ws-actions').getByRole('button', { name: t(lang, 'ws.run'), exact: true }).click();
  await page.locator('.ws-status.ws-status-done').waitFor({ timeout: 10_000 });
  return session;
}

test('console.trace shows its label, its arguments and the stack of the call in project paths', async () => {
  const { page, problems, context } = await runInExample('function formatAmount(n) {\n  console.trace("amount", n);\n  return n;\n}\nformatAmount(210);\nconsole.log("after");\n');
  const trace = page.locator('.console .console-trace');
  await trace.waitFor();
  assert.equal(await trace.count(), 1);
  assert.equal((await trace.locator('.console-tag').innerText()).trim(), 'console.trace');
  assert.deepEqual(await trace.locator('.console-arg').allInnerTexts(), ['amount', '210']);
  assert.equal(await trace.locator('.console-stack').innerText(), 'at formatAmount (index.js:2:11)\nat index.js:5:1');
  assert.match(await page.locator('.console').innerText(), /after/);
  assert.deepEqual(problems, []);
  await context.close();
});
