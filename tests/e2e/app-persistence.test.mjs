// V-03 / REQ-004 / REQ-024: unsubmitted work, position, capstone and settings survive reload and a
// platform restart; save status is honest (pending → saved, failed with retry and download);
// two tabs on the same data get a conflict with both resolutions working.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, Lab, buildFixtureDist, editorText, exact, launchChrome, onboard, openApp, replaceEditor, saveIndicator, t, waitFor, waitSaved } from './helpers.mjs';

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

const draftFiles = async (lab) => (await lab.doc(`drafts/${L1}`))?.blocks?.['basics-exercise']?.files ?? null;
const next = (page) => page.locator('.pager').getByRole('button', { name: t('uk', 'lesson.next') }).click();
const stepChip = (page) => page.locator('.chip-steps');

test('typed code, active file, lesson page, capstone and settings survive reload and restart', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    await onboard(page, 'Список бажань');
    // Settings first: style, appearance and text size are part of what must come back.
    await page.goto(lab.url('#/settings'));
    await page.getByRole('radio', { name: t('uk', 'settings.style.editorial') }).click();
    await page.getByRole('radio', { name: t('uk', 'settings.appearance.dark') }).click();
    await page.getByRole('radio', { name: t('uk', 'settings.textSize.large') }).click();
    await waitSaved(page);

    await page.goto(lab.url(`#/lesson/${L1}/2`));
    await page.locator('#block-basics-exercise').waitFor();
    const code = "import { label } from './label.js';\nconsole.log(label, 'typed but never run');\n";
    await replaceEditor(page, code);
    // Honest status: pending immediately, saved only after the server confirmed the write.
    await page.locator('.save-indicator.save-pending').waitFor({ timeout: 1000 });
    assert.equal((await saveIndicator(page).innerText()).trim(), t('uk', 'save.pending'));
    assert.equal(await saveIndicator(page).getAttribute('role'), 'status');
    await waitSaved(page);
    assert.equal((await saveIndicator(page).innerText()).trim(), t('uk', 'save.saved'));
    assert.equal((await draftFiles(lab))['index.js'], code, 'the draft is on disk without running it');

    // Look at the read-only helper file, then move on to the next lesson page.
    await page.getByRole('tab', { name: /label\.js/ }).click();
    await next(page);
    await page.locator('#block-basics-transfer').waitFor();
    assert.match(await stepChip(page).innerText(), /3/);
    await waitSaved(page);

    // 1) Browser reload of the same tab.
    await page.reload();
    await page.locator('#block-basics-transfer').waitFor();
    assert.match(await stepChip(page).innerText(), /3/);

    // 2) Platform restart on the same data directory, then a brand-new browser profile that
    //    opens the start page (no URL state): everything comes from the learner data.
    await context.close();
    await lab.restart();
    const fresh = await openApp(browser, lab, { hash: '' });
    const { page: p2 } = fresh;
    const html = p2.locator('html');
    assert.equal(await html.getAttribute('data-style'), 'editorial');
    assert.equal(await html.getAttribute('data-appearance'), 'dark');
    assert.equal(await html.getAttribute('data-text-size'), 'large');
    assert.equal(await html.getAttribute('lang'), 'uk');
    const resume = p2.getByRole('link', { name: new RegExp(t('uk', 'nav.continue')) });
    assert.match(await resume.getAttribute('href'), new RegExp(`#/lesson/${L1}/3$`), 'continue points at the last visited page');
    await resume.click();
    await p2.locator('#block-basics-transfer').waitFor();
    // Capstone choice is restored (the transfer block shows the wishlist variant).
    assert.match(await p2.locator('#block-basics-transfer').textContent(), /Список бажань/);
    assert.match(await p2.locator('#block-basics-transfer').textContent(), /Змінити заголовок сторінки бажань/);
    await p2.locator('.pager').getByRole('button', { name: t('uk', 'lesson.prev') }).click();
    await p2.locator('#block-basics-exercise').waitFor();
    assert.equal(await p2.getByRole('tab', { name: /label\.js/ }).getAttribute('aria-selected'), 'true', 'the active file is restored');
    await p2.getByRole('tab', { name: /index\.js/ }).click();
    assert.equal(await editorText(p2), code, 'typed code is restored after restart');
    assert.deepEqual([...problems, ...fresh.problems], []);
    await fresh.context.close();
  } finally {
    await lab.dispose();
  }
});

test('a failed write is reported honestly, offers retry and download, and retry saves after recovery', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    await onboard(page);
    await page.goto(lab.url(`#/lesson/${L1}/2`));
    await page.locator('#block-basics-exercise').waitFor();
    await waitSaved(page);
    const failures = [];
    page.on('response', (r) => { if (r.url().includes('/api/store/doc') && r.request().method() === 'PUT' && r.status() === 507) failures.push(r.url()); });

    assert.deepEqual(await lab.fault('write-fail'), { fault: 'write-fail' });
    const code = "import { label } from './label.js';\nconsole.log(label, 'written while the disk fails');\n";
    await replaceEditor(page, code);
    await page.locator('.save-indicator.save-failed').waitFor({ timeout: 5000 });
    assert.equal((await saveIndicator(page).innerText()).trim(), t('uk', 'save.failed'));
    const banner = page.getByRole('alert').filter({ hasText: t('uk', 'save.failedTitle') });
    await banner.waitFor();
    assert.equal(await draftFiles(lab), null, 'nothing was written');

    // Keep working while the disk still fails: the failure must stay visible, never "pending/saved".
    await page.keyboard.insertText('// more\n');
    for (let i = 0; i < 6; i += 1) {
      assert.ok(await banner.isVisible(), 'the failure banner stays while work is unsaved');
      assert.match(await saveIndicator(page).getAttribute('class'), /save-failed/);
      await page.waitForTimeout(150);
    }
    await waitFor(() => failures.length >= 3, { message: 'automatic retries keep failing', timeout: 12_000 });

    // Recovery path 1: download the unsaved work.
    const [download] = await Promise.all([page.waitForEvent('download'), banner.getByRole('button', { name: t('uk', 'save.download') }).click()]);
    const saved = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
    const draft = saved.docs.find((d) => d.id === `drafts/${L1}`);
    assert.ok(draft, 'the download contains the unsaved draft document');
    assert.equal(draft.data.blocks['basics-exercise'].files['index.js'], `${code}// more\n`);

    // Recovery path 2: the disk works again → retry saves immediately (not waiting for the timer).
    await lab.fault(null);
    const clickedAt = Date.now();
    await banner.getByRole('button', { name: t('uk', 'save.retry') }).click();
    await waitSaved(page);
    assert.ok(Date.now() - clickedAt < 3000, 'retry saved right away');
    await banner.waitFor({ state: 'detached' });
    assert.equal((await draftFiles(lab))['index.js'], `${code}// more\n`);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('a full disk is reported as not saved with its cause, and saving resumes when space is back', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { page, problems, context } = await openApp(browser, lab);
    await onboard(page);
    await page.goto(lab.url(`#/lesson/${L1}/2`));
    await page.locator('#block-basics-exercise').waitFor();
    await waitSaved(page);
    assert.deepEqual(await lab.fault('disk-full'), { fault: 'disk-full' });
    const code = "import { label } from './label.js';\nconsole.log(label, 'no space left');\n";
    await replaceEditor(page, code);
    const banner = page.getByRole('alert').filter({ hasText: t('uk', 'save.failedTitle') });
    await banner.waitFor({ timeout: 5000 });
    assert.match(await banner.innerText(), /disk-full: No space left on device/, 'the cause is shown verbatim');
    assert.equal((await saveIndicator(page).innerText()).trim(), t('uk', 'save.failed'));
    assert.equal(await draftFiles(lab), null);
    await lab.fault(null);
    await banner.getByRole('button', { name: t('uk', 'save.retry') }).click();
    await waitSaved(page);
    assert.equal((await draftFiles(lab))['index.js'], code);
    assert.deepEqual(problems, []);
    await context.close();
  } finally {
    await lab.dispose();
  }
});

test('two tabs editing the same data get a conflict; both resolutions work', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const a = await openApp(browser, lab);
    await onboard(a.page);
    await a.page.goto(lab.url(`#/lesson/${L1}/2`));
    await a.page.locator('#block-basics-exercise').waitFor();
    await waitSaved(a.page);
    const b = await openApp(browser, lab, { hash: `#/lesson/${L1}/2` });
    await b.page.locator('#block-basics-exercise').waitFor();
    await waitSaved(b.page);

    const codeA = "import { label } from './label.js';\nconsole.log(label, 'tab A');\n";
    await replaceEditor(a.page, codeA);
    await waitSaved(a.page);
    const codeB = "import { label } from './label.js';\nconsole.log(label, 'tab B');\n";
    await replaceEditor(b.page, codeB);
    const conflict = b.page.getByRole('alert').filter({ hasText: t('uk', 'save.conflictTitle') });
    await conflict.waitFor({ timeout: 5000 });
    assert.equal((await saveIndicator(b.page).innerText()).trim(), t('uk', 'save.conflict'));
    assert.equal((await draftFiles(lab))['index.js'], codeA, 'tab B did not silently overwrite tab A');

    // Resolution 1 (tab B): take the version on disk.
    await conflict.getByRole('button', { name: exact('uk', 'save.takeDisk') }).click();
    await conflict.waitFor({ state: 'detached' });
    await waitSaved(b.page);
    assert.equal(await editorText(b.page), codeA, 'tab B now shows the disk version');

    // Tab B keeps working on top of that; now tab A is the stale one.
    const codeB2 = "import { label } from './label.js';\nconsole.log(label, 'tab B again');\n";
    await replaceEditor(b.page, codeB2);
    await waitSaved(b.page);
    assert.equal((await draftFiles(lab))['index.js'], codeB2);
    const codeA2 = "import { label } from './label.js';\nconsole.log(label, 'tab A keeps its version');\n";
    await replaceEditor(a.page, codeA2);
    const conflictA = a.page.getByRole('alert').filter({ hasText: t('uk', 'save.conflictTitle') });
    await conflictA.waitFor({ timeout: 5000 });

    // Resolution 2 (tab A): keep this tab's version.
    await conflictA.getByRole('button', { name: exact('uk', 'save.keepMine') }).click();
    await conflictA.waitFor({ state: 'detached' });
    await waitSaved(a.page);
    assert.equal((await draftFiles(lab))['index.js'], codeA2, 'the kept version is on disk');
    assert.equal(await editorText(a.page), codeA2);
    assert.deepEqual([...a.problems, ...b.problems], []);
    await a.context.close();
    await b.context.close();
  } finally {
    await lab.dispose();
  }
});
