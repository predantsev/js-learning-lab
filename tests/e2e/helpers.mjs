// Shared plumbing for the application end-to-end suite (tests/e2e/app-*.test.mjs).
// Real server (server/app.mjs) on a temporary learner data directory, real Google Chrome through
// playwright-core, and synthetic fixture content compiled from tests/fixtures/content.
// Not a test file itself (no .test. in the name).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from '../../server/app.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FIXTURE_CONTENT = path.join(ROOT, 'tests', 'fixtures', 'content');
const DIST = path.join(ROOT, 'dist');

export const L1 = 'js-01-01-fixture-basics';
export const L2 = 'js-01-02-fixture-practice';
export const PLANNED = 'js-01-03-fixture-planned';

// ---------- UI strings: the same dictionaries the app ships (flat `'key': 'text',` lines) ----------
function parseDict(file) {
  const out = {};
  const text = readFileSync(path.join(ROOT, 'app', 'src', 'i18n', file), 'utf8');
  for (const m of text.matchAll(/^\s*'([^']+)':\s*'((?:[^'\\]|\\.)*)',?\s*$/gm)) out[m[1]] = m[2].replace(/\\(.)/g, '$1');
  return out;
}
const DICTS = { uk: parseDict('uk.ts'), en: parseDict('en.ts') };
/** Localized UI string exactly as the app renders it. */
export function t(lang, key, params = {}) {
  const text = DICTS[lang][key];
  assert.ok(text !== undefined, `unknown UI string ${lang}:${key}`);
  return Object.entries(params).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), text);
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Exact (anchored) accessible-name matcher for a UI string. */
export const exact = (lang, key, params) => new RegExp(`^\\s*${escapeRe(t(lang, key, params))}\\s*$`);

// ---------- build output ----------
async function exists(p) {
  return fs.access(p).then(() => true, () => false);
}
export async function assertBuilt() {
  for (const file of ['app/index.html', 'sandbox/frame.html', 'content/index.json']) {
    if (!(await exists(path.join(DIST, file)))) throw new Error(`dist/${file} is missing: run "npm run build" before the end-to-end suite (npm run test:e2e does it).`);
  }
}

/**
 * Compile the fixture content root into a temporary dist directory that reuses the built app and
 * sandbox (directory links), so the server serves fixtures without touching dist/content.
 */
export async function buildFixtureDist() {
  await assertBuilt();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-e2e-dist-'));
  process.env.JSLL_CONTENT_ROOT = FIXTURE_CONTENT; // must be set before lib.mjs is first imported
  const lib = await import('../../scripts/content/lib.mjs');
  assert.equal(lib.CONTENT_DIR, FIXTURE_CONTENT, 'content compiler must read the fixture root');
  const { issues } = await lib.buildContent({ outDir: path.join(dir, 'content'), quiet: true });
  assert.deepEqual(issues, [], 'fixture content compiles without issues');
  const type = process.platform === 'win32' ? 'junction' : 'dir';
  await fs.symlink(path.join(DIST, 'app'), path.join(dir, 'app'), type);
  await fs.symlink(path.join(DIST, 'sandbox'), path.join(dir, 'sandbox'), type);
  return dir;
}

export const launchChrome = () => chromium.launch({ channel: 'chrome', headless: true });

// ---------- server on a learner data directory ----------
export class Lab {
  constructor({ distDir, dataDir, testHooks }) {
    Object.assign(this, { distDir, dataDir, testHooks, server: null, port: 0 });
  }

  /** Start on a fresh temporary data directory (a fresh learner profile). */
  static async start({ distDir = DIST, dataDir = null, testHooks = true } = {}) {
    const lab = new Lab({ distDir, dataDir: dataDir ?? (await fs.mkdtemp(path.join(os.tmpdir(), 'jsll-e2e-data-'))), testHooks });
    await lab.#listen(0);
    return lab;
  }

  async #listen(port) {
    this.server = await startServer({ port, dataDir: this.dataDir, distDir: this.distDir, testHooks: this.testHooks, quiet: true });
    this.port = this.server.port;
  }

  /** Stop and start again on the same data directory and port (a platform restart). */
  async restart() {
    await this.stop();
    await this.#listen(this.port);
  }

  async stop() {
    if (this.server) await this.server.close();
    this.server = null;
  }

  async dispose() {
    await this.stop();
    // Closing a tab flushes pending saves (keepalive), which may still be landing on disk.
    await fs.rm(this.dataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }

  url(hash = '') {
    return `http://js-learning-lab.localhost:${this.port}/${hash}`;
  }

  /** Learner document as durably stored on disk (null when absent). */
  async doc(id) {
    const envelope = await this.server.store.get(id);
    return envelope === null ? null : envelope.data;
  }

  /** Write a learner document directly, as an older platform version would have left it. */
  async seed(id, data) {
    await this.server.store.put(id, data, { force: true });
  }

  /** The documented test hook: POST /api/__test/fault { mode }. */
  async fault(mode) {
    const response = await fetch(`http://localhost:${this.port}/api/__test/fault`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-jsll-token': this.server.store.meta.token },
      body: JSON.stringify({ mode }),
    });
    assert.equal(response.status, 200, 'fault hook answers');
    return response.json();
  }
}

// ---------- browser pages ----------
/** A learner tab. Collects application errors (not learner-code errors inside sandbox frames). */
export async function openApp(browser, lab, { hash = '#/course', viewport = { width: 1440, height: 900 }, colorScheme = 'light', context = null } = {}) {
  const ctx = context ?? (await browser.newContext({ viewport, colorScheme, acceptDownloads: true }));
  const page = await ctx.newPage();
  const problems = [];
  const fromApp = (url) => { try { return new URL(url).hostname === 'js-learning-lab.localhost'; } catch { return false; } };
  // Playwright also reports uncaught errors of child frames: learner code failing inside a sandbox
  // frame (jsll-run-N.localhost) is the scenario of some tests, not an application error.
  page.on('pageerror', (error) => { if (!/jsll-run-\d+\.localhost|\/sandbox\//.test(error.stack ?? '')) problems.push(`pageerror: ${error.message}`); });
  page.on('console', (msg) => {
    if (msg.type() !== 'error' || !fromApp(msg.location().url)) return;
    // Chrome logs every non-2xx fetch; failing API calls are the scenarios some tests provoke and
    // the app reports them in its own UI. Anything else (missing assets, React errors) counts.
    if (msg.text().startsWith('Failed to load resource') && msg.location().url.includes('/api/')) return;
    problems.push(`console: ${msg.text()} @ ${msg.location().url}`);
  });
  page.on('requestfailed', (request) => { if (fromApp(request.url()) && !request.url().includes('/sandbox/')) problems.push(`requestfailed: ${request.url()}`); });
  page.on('response', (response) => { if (fromApp(response.url()) && response.status() >= 400 && !response.url().includes('/api/')) problems.push(`HTTP ${response.status()}: ${response.url()}`); });
  await page.goto(lab.url(hash));
  try {
    await page.locator('.app').waitFor({ timeout: 15_000 });
  } catch (error) {
    const shown = await page.locator('body').innerText().catch(() => '(no body)');
    throw new Error(`the application shell did not render at ${page.url()}: ${shown.slice(0, 400)} | problems: ${problems.join('; ')}`, { cause: error });
  }
  return { context: ctx, page, problems };
}

/** First run: pick a capstone and start; lands on the first authored lesson. */
export async function onboard(page, capstoneTitle = 'Список бажань') {
  await page.getByRole('heading', { level: 1, name: t('uk', 'onboarding.title') }).waitFor();
  await page.getByRole('radio', { name: capstoneTitle }).click();
  await page.getByRole('button', { name: t('uk', 'onboarding.start') }).click();
  await page.waitForURL(/#\/lesson\//);
  await page.locator('.lesson').waitFor();
}

export const lessonUrl = (lab, id, page = 1, block = null) => lab.url(`#/lesson/${id}/${page}${block ? `?block=${block}` : ''}`);

/** Go to a lesson page through the hash router (no reload) and wait for it to render. */
export async function gotoLesson(page, id, pageNo = 1) {
  await page.evaluate(([i, p]) => { location.hash = `#/lesson/${i}/${p}`; }, [id, pageNo]);
  await page.locator('#lesson-title').waitFor();
  await page.locator('.chip-steps').filter({ hasText: new RegExp(`\\b${pageNo}\\b`) }).waitFor();
}

export const blockLocator = (page, blockId) => page.locator(`#block-${blockId}`);
export const editor = (page) => page.locator('.ws-editor .cm-content').first();

/** Current text of the visible workspace editor. */
export async function editorText(page) {
  return editor(page).evaluate((el) => [...el.querySelectorAll('.cm-line')].map((l) => l.textContent).join('\n'));
}

/** Replace the editor content (select all, insert) — no autocomplete or bracket helpers involved. */
export async function replaceEditor(page, text) {
  await editor(page).click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
}

export async function waitFor(check, { timeout = 10_000, interval = 50, message = 'condition' } = {}) {
  const started = Date.now();
  let last;
  for (;;) {
    try {
      last = await check();
      if (last) return last;
    } catch (error) {
      last = error;
    }
    if (Date.now() - started > timeout) throw new Error(`timed out waiting for ${message} (last: ${last instanceof Error ? last.message : JSON.stringify(last)})`);
    await new Promise((r) => setTimeout(r, interval));
  }
}

export const saveIndicator = (page) => page.locator('.save-indicator');
export async function waitSaved(page) {
  await page.locator('.save-indicator.save-saved').waitFor({ timeout: 10_000 });
}

/** Run with the workspace Run button and wait for the run to settle. */
export async function runCode(page) {
  await page.locator('.ws-actions').getByRole('button', { name: /Запустити|Run/ }).click();
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
