// REQ-024 / REQ-032: an edit made just before the tab closes is not lost silently.
// Security review #7 measured the case this guards: the pagehide flush uses fetch keepalive, whose
// body Chrome limits to 64 KiB, so an edit to a larger document (a draft with big files) was lost
// without a warning when the tab closed during the 500 ms save debounce. Now the save starts in
// beforeunload and the browser asks before leaving; small saves still go out with keepalive and
// need no question.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { L1, Lab, buildFixtureDist, launchChrome, onboard, openApp, replaceEditor, waitSaved } from './helpers.mjs';

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

const draftCode = async (lab) => (await lab.doc(`drafts/${L1}`))?.blocks?.['basics-exercise']?.files?.['index.js'] ?? null;

async function editThenClose(lab, bytes) {
  const { page, context } = await openApp(browser, lab);
  await onboard(page, 'Список бажань');
  await page.goto(lab.url(`#/lesson/${L1}/2`));
  await page.locator('#block-basics-exercise').waitFor();
  const filler = `// ${'x'.repeat(bytes)}\n`;
  await replaceEditor(page, `${filler}console.log('first');\n`);
  await waitSaved(page);
  const last = `${filler}console.log('last edit before closing');\n`;
  await replaceEditor(page, last);
  // Close inside the save debounce, as a learner closing the tab right after typing. When the
  // browser asks, the learner confirms leaving after a human reaction time.
  const dialogs = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.type());
    await new Promise((r) => setTimeout(r, 300));
    await dialog.accept();
  });
  const closed = new Promise((resolve) => page.once('close', resolve));
  await page.close({ runBeforeUnload: true });
  await closed;
  await context.close();
  return { last, dialogs };
}

test('an edit of a small document made just before closing the tab is saved', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { last, dialogs } = await editThenClose(lab, 2_000);
    assert.deepEqual(dialogs, [], 'keepalive carries a small save: no question on leaving');
    let saved = null;
    for (let i = 0; i < 40 && saved !== last; i++) { await new Promise((r) => setTimeout(r, 100)); saved = await draftCode(lab); }
    assert.equal(saved, last);
  } finally {
    await lab.dispose();
  }
});

test('an edit of a document larger than the keepalive limit made just before closing the tab is saved', async () => {
  const lab = await Lab.start({ distDir });
  try {
    const { last, dialogs } = await editThenClose(lab, 80_000);
    assert.deepEqual(dialogs, ['beforeunload'], 'the learner is asked before leaving while the save is under way');
    let saved = null;
    for (let i = 0; i < 40 && saved !== last; i++) { await new Promise((r) => setTimeout(r, 100)); saved = await draftCode(lab); }
    assert.equal(saved === last, true, `the last edit was ${saved === null ? 'not found' : 'not saved (an older version is on disk)'}`);
  } finally {
    await lab.dispose();
  }
});
