// Drives the lab server's fake clock: "at minute N, send this request".
import { createApp } from './app.js';

const clock = { minutes: 0, now() { return this.minutes * 60_000; } };
const server = createApp({ clock });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

async function at(minute, label, method, path, cookie) {
  clock.minutes = minute;
  const response = await fetch(base + path, { method, headers: cookie ? { cookie } : {}, signal: AbortSignal.timeout(2000) });
  console.log(`%%minute%% ${String(minute).padStart(3)} · ${label.padEnd(8)} ${method} ${path} → ${response.status}`);
  const setCookie = response.headers.getSetCookie()[0];
  return setCookie ? setCookie.split(';')[0] : cookie;
}

try {
  console.log('— %%idleAndAbsolute%% —');
  const laptop = await at(0, '%%laptop%%', 'POST', '/login');
  for (const minute of [5, 30, 55, 80, 105, 130]) await at(minute, '%%laptop%%', 'GET', '/notes', laptop);

  console.log('— %%revocation%% —');
  const desk = await at(200, '%%laptop%%', 'POST', '/login');
  const phone = await at(210, '%%phone%%', 'POST', '/login');
  await at(215, '%%phone%%', 'POST', '/password', phone);
  await at(216, '%%laptop%%', 'GET', '/notes', desk);
  await at(220, '%%phone%%', 'GET', '/notes', phone);
  await at(225, '%%phone%%', 'POST', '/logout', phone);
  await at(226, '%%phone%%', 'GET', '/notes', phone);
} finally {
  server.closeAllConnections();
  server.close();
}
