// Logs u-01 in, prints the Set-Cookie header, reads the habits with the cookie (sent together
// with another cookie, as a browser would), then logs out and tries the old cookie.
import { createApp } from './app.js';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const call = (method, path, headers = {}, body) =>
  fetch(base + path, { method, headers, body, signal: AbortSignal.timeout(2000) });
try {
  const login = await call('POST', '/login', { 'content-type': 'application/json' },
    JSON.stringify({ userId: 'u-01', password: 'sunflower-42' }));
  const setCookie = login.headers.getSetCookie()[0] ?? '';
  console.log(`login → ${login.status}, Set-Cookie: ${setCookie || '(%%none%%)'}`);
  const cookie = `theme=dark; ${setCookie.split(';')[0]}`;
  const habits = await call('GET', '/habits', { cookie });
  console.log(`GET /habits → ${habits.status} ${await habits.text()}`);
  console.log(`GET /habits %%noCookie%% → ${(await call('GET', '/habits')).status}`);
  console.log(`POST /logout → ${(await call('POST', '/logout', { cookie })).status}`);
  console.log(`GET /habits %%oldCookie%% → ${(await call('GET', '/habits', { cookie })).status}`);
} finally {
  server.closeAllConnections();
  server.close();
}
