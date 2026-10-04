// The lab notes service with three login controls and a CSRF guard:
//   - at most 5 failed logins per account and per address in a minute, then 429 + Retry-After;
//   - one answer for an unknown user and a wrong password;
//   - a 1 KB limit on the login body and a 200-character limit on the password;
//   - with checkOrigin: state-changing requests from a foreign Origin get 403.
import crypto from 'node:crypto';
import http from 'node:http';

const PARAMS = { N: 16384, r: 8, p: 1 };
const salt = crypto.randomBytes(16);
const stored = new Map([['u-01', crypto.scryptSync('sunflower-42', salt, 32, PARAMS)]]);
const dummy = crypto.scryptSync('no-such-user', salt, 32, PARAMS); // for unknown users

const MAX_FAILURES = 5;
const WINDOW_MS = 60_000;
const ALLOWED_ORIGINS = ['http://127.0.0.1:4310'];

function send(response, status, value, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(value === undefined ? '' : JSON.stringify(value));
}

async function readBody(request, maxBytes) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) return { tooLarge: true };
    chunks.push(chunk);
  }
  try {
    return { value: JSON.parse(Buffer.concat(chunks).toString('utf8')) };
  } catch {
    return { value: undefined };
  }
}

export function createApp({ clock, checkOrigin }) {
  const failures = new Map(); // "account:u-01" or "address:127.0.0.1" → { count, start }
  const sessions = new Map();

  function blockedFor(keys) {
    let wait = 0;
    for (const key of keys) {
      const entry = failures.get(key);
      if (!entry) continue;
      if (clock.now() - entry.start >= WINDOW_MS) failures.delete(key); // old entry expires
      else if (entry.count >= MAX_FAILURES) wait = Math.max(wait, entry.start + WINDOW_MS - clock.now());
    }
    return Math.ceil(wait / 1000);
  }
  function recordFailure(keys) {
    for (const key of keys) {
      const entry = failures.get(key) ?? { count: 0, start: clock.now() };
      entry.count += 1;
      failures.set(key, entry);
    }
  }

  async function handle(request, response) {
    const path = new URL(request.url, 'http://localhost').pathname;
    const stateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    const origin = request.headers.origin;
    if (checkOrigin && stateChanging && origin !== undefined && !ALLOWED_ORIGINS.includes(origin)) {
      return send(response, 403, { error: { code: 'CSRF_ORIGIN', details: {} } });
    }

    if (request.method === 'POST' && path === '/login') {
      const body = await readBody(request, 1024);
      if (body.tooLarge) return send(response, 413, { error: { code: 'PAYLOAD_TOO_LARGE', details: {} } });
      const { user, password } = body.value ?? {};
      if (typeof user !== 'string' || typeof password !== 'string' || password.length > 200) {
        return send(response, 400, { error: { code: 'VALIDATION_FAILED', details: {} } });
      }
      const keys = [`account:${user}`, `address:${request.socket.remoteAddress}`];
      const wait = blockedFor(keys);
      // Checked BEFORE hashing: a blocked attempt costs the server no scrypt work.
      if (wait > 0) return send(response, 429, { error: { code: 'TOO_MANY_ATTEMPTS', details: {} } }, { 'retry-after': String(wait) });
      // An unknown user is hashed too, so both failures take about the same time.
      const candidate = crypto.scryptSync(password, salt, 32, PARAMS);
      const ok = crypto.timingSafeEqual(candidate, stored.get(user) ?? dummy) && stored.has(user);
      if (!ok) {
        recordFailure(keys);
        return send(response, 401, { error: { code: 'BAD_CREDENTIALS', details: {} } }); // one answer for both
      }
      const id = crypto.randomBytes(32).toString('base64url');
      sessions.set(id, user);
      return send(response, 204, undefined, { 'set-cookie': `sid=${id}; HttpOnly; SameSite=Lax; Path=/` });
    }

    const user = sessions.get(/(?:^|;\s*)sid=([^;]*)/.exec(request.headers.cookie ?? '')?.[1]);
    if (!user) return send(response, 401, { error: { code: 'UNAUTHENTICATED', details: {} } });
    if (request.method === 'POST' && path === '/notes') return send(response, 201, { id: 'n-9', ownerId: user });
    return send(response, 404, { error: { code: 'NOT_FOUND', details: {} } });
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => send(response, 500, { error: { code: 'INTERNAL', details: {} } }));
  });
}
