// Spike part 3: how to make the stuck renderer of a removed runaway frame go away.
// Run: node spikes/runner-isolation/kill.mjs
import http from 'node:http';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
const PARENT = `<!doctype html><meta charset="utf-8"><body><div id="host"></div><script>
  window.ticks = 0; setInterval(() => { window.ticks++; }, 20);
  window.mount = (src) => { const f = document.createElement('iframe'); f.id = 'f'; f.setAttribute('sandbox', 'allow-scripts'); f.src = src; document.getElementById('host').replaceChildren(f); };
</script></body>`;
const FRAME = `<!doctype html><meta charset="utf-8"><body><p id="out"></p><script>
  setTimeout(() => { let i = 0; while (true) { document.getElementById('out').textContent = String(i++); } }, 30);
</script></body>`;
const handler = (req, res) => { const p = new URL(req.url, 'http://x').pathname; const b = p === '/parent.html' ? PARENT : p === '/frame.html' ? FRAME : '<!doctype html><p>blank</p>'; res.writeHead(200, { 'content-type': 'text/html' }).end(b); };
const s4 = http.createServer(handler); await new Promise((r) => s4.listen(0, '127.0.0.1', r)); const port = s4.address().port;
const s6 = http.createServer(handler); await new Promise((r) => s6.listen(port, '::1', r));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profiles = () => execSync(`ps -A -o command= | grep -F -- "--remote-debugging-pipe" | grep -o -- "--user-data-dir=[^ ]*" | sort -u || true`).toString().split('\n').filter(Boolean).map((l) => l.replace('--user-data-dir=', ''));
const busy = (dir) => execSync(`ps -A -o pid=,%cpu=,command= | grep -i "Chrome Helper (Renderer)" | grep -F "${dir}" | grep -v grep || true`).toString().split('\n').filter(Boolean).map((l) => l.trim().split(/\s+/)).filter((c) => Number(c[1]) > 60).length;
const stops = {
  'remove-element': (page) => page.evaluate(() => document.getElementById('f').remove()),
  'navigate-blank-then-remove': async (page) => { await page.evaluate(() => { document.getElementById('f').src = 'about:blank'; }); await sleep(300); await page.evaluate(() => document.getElementById('f').remove()); },
  'navigate-other-site-then-remove': async (page, port) => { await page.evaluate((u) => { document.getElementById('f').src = u; }, `http://jsll-idle.localhost:${port}/blank.html`); await sleep(1500); await page.evaluate(() => document.getElementById('f').remove()); },
};
const results = [];
let version = '';
for (const [id, stop] of Object.entries(stops)) {
  const before = new Set(profiles());
  const browser = await chromium.launch({ channel: 'chrome', headless: true }); version = browser.version();
  const dir = profiles().find((d) => !before.has(d));
  const page = await (await browser.newContext()).newPage();
  await page.goto(`http://js-learning-lab.localhost:${port}/parent.html`);
  await page.evaluate((src) => window.mount(src), `http://jsll-run-0.localhost:${port}/frame.html`);
  await sleep(1500);
  const row = { id, busyDuringLoop: busy(dir), busyAfterStop: [] };
  await stop(page, port);
  const t0 = Date.now();
  for (const at of [1000, 3000, 6000, 12000, 20000, 30000]) { await sleep(at - (Date.now() - t0)); row.busyAfterStop.push({ atMs: at, busy: busy(dir) }); if (row.busyAfterStop.at(-1).busy === 0) break; }
  const a = await page.evaluate(() => window.ticks); await sleep(300);
  row.parentResponsive = (await page.evaluate(() => window.ticks)) - a > 5;
  results.push(row);
  await Promise.race([browser.close(), sleep(4000)]);
}
s4.close(); s6.close();
writeFileSync(new URL('../../docs/evidence/M1/spike-runner-kill.json', import.meta.url), JSON.stringify({ spike: 'runner-kill-stuck-renderer', date: new Date().toISOString(), environment: { browser: `Google Chrome ${version} (headless, channel=chrome)`, platform: `${process.platform} ${process.arch}`, node: process.version }, results }, null, 2) + '\n');
for (const r of results) console.log(r.id, '| during', r.busyDuringLoop, '| after', r.busyAfterStop.map((x) => `${x.atMs}:${x.busy}`).join(' '), '| parentOK', r.parentResponsive);
process.exit(0);
