// Starts your service with a lab key, logs in as u-01 and reads the bookmarks. Change it as you like:
// the checks import app.js and passwords.js directly.
import crypto from 'node:crypto';
import { createApp } from './app.js';

const env = { SESSION_SECRET: crypto.randomBytes(32).toString('base64url') }; // lab only
let server;
try {
  server = createApp({ env });
} catch (error) {
  console.log(`createApp: ${error.message}`);
}
if (server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const login = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user: 'u-01', password: 'sunflower-42' }),
      signal: AbortSignal.timeout(2000),
    });
    const cookie = login.headers.getSetCookie()[0]?.split(';')[0] ?? '';
    console.log(`POST /login → ${login.status}`);
    const list = await fetch(`${base}/bookmarks`, { headers: { cookie }, signal: AbortSignal.timeout(2000) });
    console.log(`GET /bookmarks → ${list.status} ${await list.text()}`);
  } finally {
    server.closeAllConnections();
    server.close();
  }
}
