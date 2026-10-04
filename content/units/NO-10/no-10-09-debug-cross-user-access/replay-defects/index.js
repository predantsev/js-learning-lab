// Replays the four seeded requests against the released service, plus the owner's own read.
import { createApp } from './app.js';

const clock = { ms: 0, now() { return this.ms; } };
const server = createApp({ clock });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const call = (method, path, headers = {}, body) => fetch(base + path, { method, headers, body, signal: AbortSignal.timeout(2000) });
const login = async (user, password) => {
  const response = await call('POST', '/login', { 'content-type': 'application/json' }, JSON.stringify({ user, password }));
  return response.headers.getSetCookie()[0]?.split(';')[0] ?? '';
};
const show = async (label, response) => console.log(`${label} → ${response.status} ${(await response.text()).slice(0, 70)}`);

try {
  const old = await login('u-01', 'sunflower-42'); // logged in at minute 0
  const bohdan = await login('u-02', 'river-stone-7');
  await show('A u-02 GET /notes/n-1', await call('GET', '/notes/n-1', { cookie: bohdan }));

  clock.ms = 180 * 60_000; // three hours later
  await show('B %%expired%% GET /notes/n-1', await call('GET', '/notes/n-1', { cookie: old }));

  const marta = await login('u-01', 'sunflower-42');
  await call('POST', '/logout', { cookie: marta });
  await show('C %%afterLogout%% GET /notes/n-1', await call('GET', '/notes/n-1', { cookie: marta }));

  await show('D curl + Origin GET /notes', await call('GET', '/notes', { origin: 'http://127.0.0.1:4310' }));

  const fresh = await login('u-01', 'sunflower-42');
  await show('%%owner%% GET /notes/n-1', await call('GET', '/notes/n-1', { cookie: fresh }));
} finally {
  server.closeAllConnections();
  server.close();
}
