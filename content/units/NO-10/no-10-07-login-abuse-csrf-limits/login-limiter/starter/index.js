// Seven wrong passwords for u-01, then a POST /wishes with three different Origin headers.
import { createApp } from './app.js';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const call = (method, path, headers = {}, body) => fetch(base + path, { method, headers, body, signal: AbortSignal.timeout(2000) });
const login = (user, password) => call('POST', '/login', { 'content-type': 'application/json' }, JSON.stringify({ user, password }));
try {
  const statuses = [];
  for (let attempt = 1; attempt <= 7; attempt += 1) {
    const response = await login('u-01', `guess-${attempt}`);
    statuses.push(response.headers.get('retry-after') ? `${response.status} (Retry-After ${response.headers.get('retry-after')})` : response.status);
  }
  console.log(`%%wrongLogins%%: ${statuses.join(', ')}`);

  const cookie = (await login('u-02', 'river-stone-7')).headers.getSetCookie()[0]?.split(';')[0] ?? '';
  for (const origin of ['http://127.0.0.1:4310', 'http://127.0.0.1:5173', undefined]) {
    const response = await call('POST', '/wishes', origin ? { cookie, origin } : { cookie });
    console.log(`POST /wishes, Origin ${origin ?? '(%%none%%)'} → ${response.status}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
