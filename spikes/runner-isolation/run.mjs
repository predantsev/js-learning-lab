// Feasibility spike for DEC-03 / REQ-021 / REQ-022 (V-11).
// Question: which iframe arrangement keeps the platform page responsive while learner
// code runs a synchronous runaway DOM loop, and what can sandboxed code reach?
// Run: node spikes/runner-isolation/run.mjs   (uses the locally installed Google Chrome)
import http from 'node:http';
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PARENT_HTML = `<!doctype html><meta charset="utf-8"><title>parent</title>
<body><div id="host"></div><script>
  window.ticks = 0;
  setInterval(() => { window.ticks++; }, 20);
  localStorage.setItem('platform-secret', 'profile-data');
  window.messages = [];
  addEventListener('message', (e) => window.messages.push({ origin: e.origin, data: e.data }));
  window.mount = (src, sandbox) => {
    const f = document.createElement('iframe');
    if (sandbox !== null) f.setAttribute('sandbox', sandbox);
    f.src = src; f.id = 'runner';
    document.getElementById('host').replaceChildren(f);
  };
  window.unmount = () => document.getElementById('host').replaceChildren();
</script></body>`;

// The frame reports what it can reach, then (mode=loop) spins forever while touching the DOM.
const FRAME_HTML = `<!doctype html><meta charset="utf-8"><title>frame</title>
<body><p id="out">0</p><script>
  const mode = new URLSearchParams(location.search).get('mode');
  const probe = (fn) => { try { return 'ok:' + fn(); } catch (e) { return 'denied:' + e.name; } };
  const report = {
    origin: self.origin,
    parentDocument: probe(() => parent.document.title),
    parentStorage: probe(() => parent.localStorage.getItem('platform-secret')),
    ownLocalStorage: probe(() => { localStorage.setItem('k', 'v'); return localStorage.getItem('k'); }),
    topNavigation: 'not-attempted',
  };
  parent.postMessage({ type: 'report', report }, '*');
  if (mode === 'loop') {
    setTimeout(() => {
      parent.postMessage({ type: 'loop-start' }, '*');
      let i = 0;
      const out = document.getElementById('out');
      while (true) { out.textContent = String(i++); }
    }, 50);
  } else {
    parent.postMessage({ type: 'done', value: 6 * 7 }, '*');
  }
</script></body>`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const body = url.pathname === '/parent.html' ? PARENT_HTML : url.pathname === '/frame.html' ? FRAME_HTML : null;
  if (body === null) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(body);
});
// `*.localhost` resolves to ::1 first on macOS; listen on both loopback families.
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const server6 = http.createServer(server.listeners('request')[0]);
await new Promise((r) => server6.listen(port, '::1', r)).catch(() => {});

const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r('__timeout__'), ms))]);

const variants = [
  { id: 'A-srcdoc-like-same-origin-sandboxed', host: 'js-learning-lab.localhost', sandbox: 'allow-scripts' },
  { id: 'B-same-site-subdomain-sandboxed', host: 'sandbox.js-learning-lab.localhost', sandbox: 'allow-scripts' },
  { id: 'C-cross-site-ip-sandboxed-opaque', host: '127.0.0.1', sandbox: 'allow-scripts' },
  { id: 'D-cross-site-ip-allow-same-origin', host: '127.0.0.1', sandbox: 'allow-scripts allow-same-origin' },
  { id: 'E-cross-site-other-localhost-name', host: 'jsll-sandbox.localhost', sandbox: 'allow-scripts' },
  { id: 'F-same-origin-unsandboxed-control', host: 'js-learning-lab.localhost', sandbox: null },
];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
for (const v of variants) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const row = { id: v.id, frameHost: v.host, sandbox: v.sandbox };
  try {
    await page.goto(`http://js-learning-lab.localhost:${port}/parent.html`);
    // 1) capability report from a harmless run
    await page.evaluate(([src, sb]) => window.mount(src, sb), [`http://${v.host}:${port}/frame.html?mode=ok`, v.sandbox]);
    await page.waitForFunction(() => window.messages.some((m) => m.data.type === 'done'), null, { timeout: 5000 });
    const msgs = await page.evaluate(() => window.messages);
    row.report = msgs.find((m) => m.data.type === 'report').data.report;
    row.messageOrigin = msgs[0].origin;
    // 2) runaway synchronous DOM loop
    await page.evaluate(() => { window.messages = []; });
    await page.evaluate(([src, sb]) => window.mount(src, sb), [`http://${v.host}:${port}/frame.html?mode=loop`, v.sandbox]);
    await withTimeout(page.waitForFunction(() => window.messages.some((m) => m.data.type === 'loop-start'), null, { timeout: 4000 }).catch(() => {}), 4500);
    const t0 = await withTimeout(page.evaluate(() => window.ticks), 1500);
    await new Promise((r) => setTimeout(r, 1500));
    const t1 = await withTimeout(page.evaluate(() => window.ticks), 1500);
    row.parentResponsiveDuringLoop = t0 !== '__timeout__' && t1 !== '__timeout__' && t1 - t0 > 20;
    row.ticksDuringLoop = t0 === '__timeout__' || t1 === '__timeout__' ? null : t1 - t0;
    if (row.parentResponsiveDuringLoop) {
      // 3) stop by removing the frame, then rerun in a fresh context
      await page.evaluate(() => { window.unmount(); window.messages = []; });
      await page.evaluate(([src, sb]) => window.mount(src, sb), [`http://${v.host}:${port}/frame.html?mode=ok`, v.sandbox]);
      await page.waitForFunction(() => window.messages.some((m) => m.data.type === 'done'), null, { timeout: 5000 });
      row.stopAndRerun = 'ok';
      row.platformStorageIntact = await page.evaluate(() => localStorage.getItem('platform-secret')) === 'profile-data';
    } else {
      row.stopAndRerun = 'not-possible-parent-frozen';
    }
  } catch (e) {
    row.error = String(e.message).split('\n')[0];
  }
  results.push(row);
  await withTimeout(context.close(), 3000);
}
const version = browser.version();
await withTimeout(browser.close(), 5000);
server.close(); server6.close();

const evidence = {
  spike: 'runner-isolation',
  date: new Date().toISOString(),
  environment: { browser: `Google Chrome ${version} (headless, channel=chrome)`, platform: `${process.platform} ${process.arch}`, node: process.version },
  parentOrigin: `http://js-learning-lab.localhost:<port>`,
  results,
};
mkdirSync(new URL('../../docs/evidence/M1/', import.meta.url), { recursive: true });
writeFileSync(new URL('../../docs/evidence/M1/spike-runner-isolation.json', import.meta.url), JSON.stringify(evidence, null, 2) + '\n');
for (const r of results) console.log(r.id.padEnd(40), 'responsive:', r.parentResponsiveDuringLoop, 'ticks:', r.ticksDuringLoop, '| parentDoc:', r.report?.parentDocument, '| parentStorage:', r.report?.parentStorage, '| ownLS:', r.report?.ownLocalStorage, '| rerun:', r.stopAndRerun, r.error ?? '');
process.exit(0);
