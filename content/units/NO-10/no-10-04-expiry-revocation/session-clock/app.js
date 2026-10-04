// The lab notes service with session expiry and revocation. Time comes from an injected
// clock, so a program (or a test) can say "it is now minute 45" instead of waiting 45 minutes.
import crypto from 'node:crypto';
import http from 'node:http';

export const IDLE_MS = 30 * 60_000; // 30 minutes without requests
export const ABSOLUTE_MS = 120 * 60_000; // 2 hours after login, whatever happens

function send(response, status, value, headers = {}) {
  const text = value === undefined ? '' : JSON.stringify(value);
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(text);
}

export function createApp({ clock }) {
  const sessions = new Map(); // id → { userId, createdAt, lastSeenAt }

  const sidOf = (request) => /(?:^|;\s*)sid=([^;]*)/.exec(request.headers.cookie ?? '')?.[1];

  // A session is valid while it is neither idle too long nor too old.
  function currentSession(request) {
    const id = sidOf(request);
    const session = sessions.get(id);
    if (!session) return null;
    const now = clock.now();
    if (now - session.lastSeenAt > IDLE_MS || now - session.createdAt > ABSOLUTE_MS) {
      sessions.delete(id); // expired: forget it on the server
      return null;
    }
    session.lastSeenAt = now; // every valid request extends the idle window
    return { id, ...session };
  }

  return http.createServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (request.method === 'POST' && path === '/login') {
      // The lab skips the password here: lesson 2 showed how it is checked.
      const id = crypto.randomBytes(32).toString('base64url');
      sessions.set(id, { userId: 'u-01', createdAt: clock.now(), lastSeenAt: clock.now() });
      return send(response, 204, undefined, { 'set-cookie': `sid=${id}; HttpOnly; SameSite=Lax; Path=/` });
    }
    const session = currentSession(request);
    if (!session) return send(response, 401, { error: { code: 'UNAUTHENTICATED', details: {} } });
    if (request.method === 'POST' && path === '/logout') {
      sessions.delete(session.id); // deleted on the server, not only in the browser
      return send(response, 204, undefined, { 'set-cookie': 'sid=; Max-Age=0; Path=/' });
    }
    if (request.method === 'POST' && path === '/password') {
      // A new password ends every OTHER session of this user at once.
      for (const [id, other] of sessions) {
        if (other.userId === session.userId && id !== session.id) sessions.delete(id);
      }
      return send(response, 204);
    }
    if (request.method === 'GET' && path === '/notes') return send(response, 200, [{ id: 'n-1', title: '%%gifts%%' }]);
    return send(response, 404, { error: { code: 'NOT_FOUND', details: {} } });
  });
}
