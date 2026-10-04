// The hardened lab notes service (read-only) — the system your threat model describes.
// Controls: login rate limit, 1 KB login body limit, session check, ownership-scoped notes,
// Origin check for state-changing requests, CORS header only for the web client's origin.
import crypto from 'node:crypto';
import http from 'node:http';

export const WEB_CLIENT = 'http://127.0.0.1:4310';
const PASSWORDS = new Map([['u-01', 'sunflower-42'], ['u-02', 'river-stone-7']]); // lab only
const NOTES = [
  { id: 'n-1', ownerId: 'u-01', title: '%%gifts%%' },
  { id: 'n-2', ownerId: 'u-02', title: '%%shopping%%' },
];

export function createLabServer() {
  const sessions = new Map();
  const failures = new Map(); // account → count (the lab never moves its clock)

  function send(response, status, value, headers = {}) {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
    response.end(value === undefined ? '' : JSON.stringify(value));
  }

  async function handle(request, response) {
    const cors = request.headers.origin === WEB_CLIENT ? { 'access-control-allow-origin': WEB_CLIENT, vary: 'Origin' } : { vary: 'Origin' };
    const origin = request.headers.origin;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && origin !== undefined && origin !== WEB_CLIENT) {
      return send(response, 403, { error: { code: 'CSRF_ORIGIN', details: {} } }, cors);
    }
    const path = new URL(request.url, 'http://localhost').pathname;
    if (request.method === 'POST' && path === '/login') {
      let size = 0;
      const chunks = [];
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 1024) return send(response, 413, { error: { code: 'PAYLOAD_TOO_LARGE', details: {} } }, cors);
        chunks.push(chunk);
      }
      const { user, password } = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      if ((failures.get(user) ?? 0) >= 5) return send(response, 429, { error: { code: 'TOO_MANY_ATTEMPTS', details: {} } }, { ...cors, 'retry-after': '60' });
      if (PASSWORDS.get(user) !== password) {
        failures.set(user, (failures.get(user) ?? 0) + 1);
        return send(response, 401, { error: { code: 'BAD_CREDENTIALS', details: {} } }, cors);
      }
      const id = crypto.randomBytes(32).toString('base64url');
      sessions.set(id, user);
      return send(response, 204, undefined, { ...cors, 'set-cookie': `sid=${id}; HttpOnly; SameSite=Lax; Path=/` });
    }
    const userId = sessions.get(/(?:^|;\s*)sid=([^;]*)/.exec(request.headers.cookie ?? '')?.[1]);
    if (!userId) return send(response, 401, { error: { code: 'UNAUTHENTICATED', details: {} } }, cors);
    if (request.method === 'GET' && path === '/notes') return send(response, 200, NOTES.filter((n) => n.ownerId === userId), cors);
    const id = /^\/notes\/([^/]+)$/.exec(path)?.[1];
    const note = NOTES.find((n) => n.id === id && n.ownerId === userId);
    if (request.method === 'GET' && note) return send(response, 200, note, cors);
    if (request.method === 'POST' && path === '/notes') return send(response, 201, { id: 'n-9', ownerId: userId }, cors);
    return send(response, 404, { error: { code: 'NOT_FOUND', details: {} } }, cors);
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => send(response, 500, { error: { code: 'INTERNAL', details: {} } }));
  });
}

// The service's config check (as in the lesson on secrets).
export function loadSecrets(env) {
  const key = env.SESSION_SECRET;
  if (key === undefined || key === 'changeme' || key.length < 32) throw new Error('SESSION_SECRET is missing or weak');
  return { key };
}
