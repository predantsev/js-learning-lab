// Logs u-01 in, calls GET /notes with and without the credential, logs out, and tries the
// old credential again — once in session mode and once in token mode.
// This program is not a browser: it has no cookie store, so it sends the Cookie header itself.
import { createApp } from './app.js';

async function scenario(mode) {
  const server = createApp({ mode });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (method, path, headers = {}, body) =>
    fetch(base + path, { method, headers, body, signal: AbortSignal.timeout(2000) });
  try {
    console.log(`— ${mode} —`);
    const login = await call('POST', '/login', { 'content-type': 'application/json' },
      JSON.stringify({ userId: 'u-01', password: 'sunflower-42' }));
    let credential;
    if (mode === 'session') {
      const setCookie = login.headers.getSetCookie()[0];
      console.log(`login → ${login.status}, Set-Cookie: ${setCookie}`);
      credential = { cookie: setCookie.split(';')[0] }; // only "sid=…" travels back
    } else {
      const { token } = await login.json();
      console.log(`login → ${login.status}, token: ${token.slice(0, 24)}… (${token.length} %%chars%%)`);
      credential = { authorization: `Bearer ${token}` };
    }
    console.log(`GET /notes %%withCredential%% → ${(await call('GET', '/notes', credential)).status}`);
    console.log(`GET /notes %%without%% → ${(await call('GET', '/notes')).status}`);
    console.log(`POST /logout → ${(await call('POST', '/logout', credential)).status}`);
    console.log(`GET /notes %%oldCredential%% → ${(await call('GET', '/notes', credential)).status}`);
  } finally {
    server.closeAllConnections();
    server.close();
  }
}

await scenario('session');
await scenario('token');
