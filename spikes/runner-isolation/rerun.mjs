// Spike part 2 (REQ-022): after a synchronous runaway loop, which stop strategy gives a
// clean rerun, and does the stuck renderer process go away?
// Run: node spikes/runner-isolation/rerun.mjs
import http from 'node:http';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PARENT_HTML = `<!doctype html><meta charset="utf-8"><title>parent</title>
<body><div id="host"></div><script>
  window.ticks = 0; setInterval(() => { window.ticks++; }, 20);
  window.messages = [];
  addEventListener('message', (e) => window.messages.push(e.data));
  window.mount = (src) => { const f = document.createElement('iframe'); f.setAttribute('sandbox', 'allow-scripts'); f.src = src; document.getElementById('host').replaceChildren(f); };
  window.unmount = () => document.getElementById('host').replaceChildren();
</script></body>`;
const FRAME_HTML = `<!doctype html><meta charset="utf-8"><body><p id="out"></p><script>
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'loop') setTimeout(() => { parent.postMessage({ type: 'loop-start' }, '*'); let i = 0; while (true) { document.getElementById('out').textContent = String(i++); } }, 30);
  else parent.postMessage({ type: 'done' }, '*');
</script></body>`;

const handler = (req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  const body = p === '/parent.html' ? PARENT_HTML : p === '/frame.html' ? FRAME_HTML : null;
  if (body === null) return void res.writeHead(404).end();
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(body);
};
const s4 = http.createServer(handler); await new Promise((r) => s4.listen(0, '127.0.0.1', r));
const port = s4.address().port;
const s6 = http.createServer(handler); await new Promise((r) => s6.listen(port, '::1', r));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Count only renderers that belong to the browser instance under test (matched by its profile dir).
const busyRenderers = (profileDir) => {
  const out = execSync(`ps -A -o pid=,%cpu=,command= | grep -i "Chrome Helper (Renderer)" | grep -F "${profileDir}" | grep -v grep || true`).toString();
  const rows = out.split('\n').filter(Boolean).map((l) => l.trim().split(/\s+/));
  return { renderers: rows.length, busy: rows.filter((c) => Number(c[1]) > 60).length };
};
const profileOf = (browser) => {
  const out = execSync(`ps -A -o command= | grep -F -- "--remote-debugging-pipe" | grep -o -- "--user-data-dir=[^ ]*" | sort -u || true`).toString().split('\n').filter(Boolean);
  return out.map((l) => l.replace('--user-data-dir=', ''));
};
const waitMsg = (page, type, ms) => page.waitForFunction((t) => window.messages.some((m) => m.type === t), type, { timeout: ms }).then(() => true).catch(() => false);

const strategies = [
  { id: 'same-site-immediate', nextHost: () => '127.0.0.1', delayMs: 0 },
  { id: 'same-site-after-3s', nextHost: () => '127.0.0.1', delayMs: 3000 },
  { id: 'fresh-site-per-run-immediate', nextHost: (n) => `jsll-run-${n}.localhost`, delayMs: 0 },
];
const results = [];
let version = '';
for (const s of strategies) {
  const before = new Set(profileOf());
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  version = browser.version();
  const profileDir = profileOf().find((d) => !before.has(d));
  const context = await browser.newContext(); const page = await context.newPage();
  const row = { id: s.id };
  await page.goto(`http://js-learning-lab.localhost:${port}/parent.html`);
  const host0 = s.nextHost(0);
  await page.evaluate((src) => window.mount(src), `http://${host0}:${port}/frame.html?mode=loop`);
  row.loopStarted = await waitMsg(page, 'loop-start', 4000);
  await sleep(1200);
  row.busyRenderersDuringLoop = busyRenderers(profileDir);
  await page.evaluate(() => { window.unmount(); window.messages = []; });
  if (s.delayMs) await sleep(s.delayMs);
  const t = Date.now();
  await page.evaluate((src) => window.mount(src), `http://${s.nextHost(1)}:${port}/frame.html?mode=ok`);
  row.rerunCompleted = await waitMsg(page, 'done', 6000);
  row.rerunMs = row.rerunCompleted ? Date.now() - t : null;
  const b = await page.evaluate(() => window.ticks); await sleep(500);
  row.parentStillResponsive = (await page.evaluate(() => window.ticks)) - b > 10;
  // does the stuck renderer disappear once its frame is gone?
  row.busyRenderersAfterStop = [];
  for (const wait of [0, 2000, 4000, 8000]) { await sleep(wait === 0 ? 0 : wait - (row.busyRenderersAfterStop.at(-1)?.atMs ?? 0)); row.busyRenderersAfterStop.push({ atMs: wait, ...busyRenderers(profileDir) }); }
  results.push(row);
  await Promise.race([browser.close(), sleep(4000)]);
  await sleep(500);
}
s4.close(); s6.close();
mkdirSync(new URL('../../docs/evidence/M1/', import.meta.url), { recursive: true });
writeFileSync(new URL('../../docs/evidence/M1/spike-runner-stop-rerun.json', import.meta.url), JSON.stringify({ spike: 'runner-stop-rerun', date: new Date().toISOString(), environment: { browser: `Google Chrome ${version} (headless, channel=chrome)`, platform: `${process.platform} ${process.arch}`, node: process.version }, results }, null, 2) + '\n');
console.log(JSON.stringify(results, null, 1));
process.exit(0);
