// `--locale` of the content scripts (scripts/content/browser-locale.mjs): the learner's code in the
// sandbox sees the chosen locale through Intl, navigator.language and localeCompare.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import { localeArg, localeOptions } from '../../scripts/content/browser-locale.mjs';
import { startServer } from '../../server/app.mjs';

let server;
let dataDir;
before(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-locale-'));
  server = await startServer({ port: 0, dataDir, quiet: true });
});
after(async () => {
  await server?.close();
  await fs.rm(dataDir, { recursive: true, force: true });
});

const PROBE = 'console.log(Intl.DateTimeFormat().resolvedOptions().locale, navigator.language, (1234.5).toLocaleString(), ["я", "і", "є"].sort((a, b) => a.localeCompare(b)).join(""));';

async function probe(locale) {
  const options = localeOptions(locale);
  const browser = await chromium.launch({ channel: 'chrome', headless: true, ...options.launch });
  try {
    const page = await browser.newPage(options.page);
    await page.goto(`http://js-learning-lab.localhost:${server.port}/harness.html`);
    await page.waitForFunction(() => document.documentElement.dataset.harness === 'ready');
    const r = await page.evaluate((code) => window.jsll.runProject({ runtime: 'browser-js', entry: 'index.js', files: { 'index.js': code }, options: {} }), PROBE);
    return r.console.filter((e) => e.level === 'log').map((e) => e.args.map((a) => a.v).join(' '))[0];
  } finally {
    await browser.close();
  }
}

test('--locale is parsed strictly and leaves the default untouched', () => {
  assert.equal(localeArg(['--unit', 'JS-12']), null);
  assert.equal(localeArg(['--locale', 'uk-UA']), 'uk-UA');
  assert.throws(() => localeArg(['--locale']), /language tag/);
  assert.throws(() => localeArg(['--locale', 'ukrainian']), /language tag/);
  assert.deepEqual(localeOptions(null), { launch: {}, page: {} });
});

test('the sandbox sees uk-UA or en-US through Intl, navigator.language and localeCompare', async () => {
  const uk = await probe('uk-UA');
  assert.match(uk, /^uk-UA uk-UA 1\s234,5 єія$/);
  const en = await probe('en-US');
  assert.match(en, /^en-US en-US 1,234\.5 /);
});
