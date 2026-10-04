// Runs the happy-path checks, then four attack requests, and prints what each attack achieved.
import { createServer } from './server.js';

const logLines = [];
const server = createServer({ log: (line) => logLines.push(line) });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const get = (path, headers = {}) => fetch(base + path, { headers, signal: AbortSignal.timeout(2000) });
const verdict = (broken) => (broken ? '%%vulnerable%%' : 'ok');

try {
  // The happy path: what the existing tests check.
  const list = await get('/items?filter[category]=home');
  const snapshot = await get('/snapshots/2026-03-01.json');
  console.log(`%%happyPath%%: GET /items?filter[category]=home → ${list.status}, GET /snapshots/2026-03-01.json → ${snapshot.status}`);

  // 1. Path traversal: "....//" survives the removal of "../" and becomes "../".
  const traversal = await get('/snapshots/....%2F%2Fsecret.json');
  const traversalText = await traversal.text();
  console.log(`1 traversal → ${traversal.status} ${verdict(traversalText.includes('sessionSecret'))}`);

  // 2. A bearer token in the log.
  await get('/items', { authorization: 'Bearer demo-session-7f3a' });
  console.log(`2 %%tokenInLog%% → ${verdict(logLines.some((line) => line.includes('demo-session-7f3a')))}`);

  // 3. A stack trace in an error response.
  const crash = await get('/items/w-99/price-per-month');
  const crashText = await crash.text();
  console.log(`3 %%stackInResponse%% → ${crash.status} ${verdict(/\bat\s.+:\d+:\d+/.test(crashText))}`);

  // 4. The vulnerable query parser: does a brand-new empty object now have isAdmin?
  await get('/items?__proto__[isAdmin]=true');
  console.log(`4 %%prototype%% → ${verdict({}.isAdmin !== undefined)}`);
} finally {
  delete Object.prototype.isAdmin; // clean up, whatever happened
  server.closeAllConnections();
  server.close();
}
