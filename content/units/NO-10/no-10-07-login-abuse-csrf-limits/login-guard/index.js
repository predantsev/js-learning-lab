// Part 1: an "attack script" fires 20 wrong passwords at u-01, then the clock moves on.
// Part 2: this program plays a browser that holds u-01's session cookie and sends a
// state-changing POST with three different Origin headers, without and with the Origin check.
import { createApp } from './app.js';

const clock = { ms: 0, now() { return this.ms; } };

async function withServer(options, work) {
  const server = createApp({ clock, ...options });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (method, path, headers = {}, body) => fetch(base + path, { method, headers, body, signal: AbortSignal.timeout(2000) });
  const login = (user, password) => call('POST', '/login', { 'content-type': 'application/json' }, JSON.stringify({ user, password }));
  try {
    await work(call, login);
  } finally {
    server.closeAllConnections();
    server.close();
  }
}

await withServer({ checkOrigin: false }, async (call, login) => {
  console.log('— %%bruteForce%% —');
  const counts = {};
  let retryAfter;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const response = await login('u-01', `guess-${attempt}`);
    counts[response.status] = (counts[response.status] ?? 0) + 1;
    retryAfter ??= response.headers.get('retry-after') ?? undefined;
  }
  console.log(`20 %%attempts%%: ${JSON.stringify(counts)}, Retry-After: ${retryAfter} s`);
  clock.ms += 61_000; // a minute later: the counters have expired
  const unknown = await login('u-77', 'guess');
  const wrong = await login('u-01', 'guess-21');
  console.log(`%%minuteLater%%, %%unknownUser%%: ${unknown.status} ${await unknown.text()}`);
  console.log(`%%minuteLater%%, %%wrongPassword%%: ${wrong.status} ${await wrong.text()}`);
  console.log(`%%minuteLater%%, %%rightPassword%%: ${(await login('u-01', 'sunflower-42')).status}`);
});

for (const checkOrigin of [false, true]) {
  await withServer({ checkOrigin }, async (call, login) => {
    console.log(`— POST /notes, %%originCheck%%: ${checkOrigin} —`);
    const cookie = (await login('u-01', 'sunflower-42')).headers.getSetCookie()[0].split(';')[0];
    for (const origin of ['http://127.0.0.1:4310', 'http://127.0.0.1:5173', 'https://evil.example']) {
      const response = await call('POST', '/notes', { cookie, origin });
      console.log(`  Origin ${origin} → ${response.status}`);
    }
  });
}
