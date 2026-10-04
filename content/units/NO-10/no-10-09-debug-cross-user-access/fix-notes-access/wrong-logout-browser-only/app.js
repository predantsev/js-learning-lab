// The lab notes service as it was released. Time comes from an injected clock: clock.now().
// Login is kept minimal here (no rate or body limit from lesson 7) so that the four findings stay in focus.
import crypto from 'node:crypto';
import http from 'node:http';
import { ABSOLUTE_MS, PASSWORDS, WEB_CLIENT, seedNotes } from './lab-data.js';

function send(response, status, value, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(value === undefined ? '' : JSON.stringify(value));
}
const fail = (response, status, code) => send(response, status, { error: { code, details: {} } });

export function createApp({ clock }) {
  const notes = seedNotes.map((note) => ({ ...note }));
  const sessions = new Map(); // id → { userId, expiresAt }

  const sidOf = (request) => /(?:^|;\s*)sid=([^;]*)/.exec(request.headers.cookie ?? '')?.[1];

  function currentUser(request) {
    const session = sessions.get(sidOf(request));
    if (!session) return null;
    if (session.expiresAt < clock.now()) return null; // expired: clock.now is a function — call it
    return session.userId;
  }

  async function handle(request, response) {
    const path = new URL(request.url, 'http://localhost').pathname;

    if (request.method === 'POST' && path === '/login') {
      let text = '';
      for await (const chunk of request) text += chunk;
      const { user, password } = JSON.parse(text || '{}');
      if (PASSWORDS.get(user) !== password) return fail(response, 401, 'BAD_CREDENTIALS');
      const id = crypto.randomBytes(32).toString('base64url');
      sessions.set(id, { userId: user, expiresAt: clock.now() + ABSOLUTE_MS });
      return send(response, 204, undefined, { 'set-cookie': `sid=${id}; HttpOnly; SameSite=Lax; Path=/` });
    }

    if (request.method === 'POST' && path === '/logout') {
      return send(response, 204, undefined, { 'set-cookie': 'sid=; Max-Age=0; Path=/' });
    }

    const userId = currentUser(request);
    if (request.method === 'GET' && path === '/notes') {
      // CORS only tells browsers who may read the answer; the session decides who gets data.
      if (!userId) return fail(response, 401, 'UNAUTHENTICATED');
      const own = notes.filter((note) => note.ownerId === userId);
      return send(response, 200, own, request.headers.origin === WEB_CLIENT ? { 'access-control-allow-origin': WEB_CLIENT } : {});
    }

    const id = /^\/notes\/([^/]+)$/.exec(path)?.[1];
    if (request.method === 'GET' && id) {
      if (!userId) return fail(response, 401, 'UNAUTHENTICATED');
      // Scoped by owner: someone else's note answers exactly like a missing one.
      const note = notes.find((candidate) => candidate.id === id && candidate.ownerId === userId);
      if (!note) return fail(response, 404, 'NOT_FOUND');
      return send(response, 200, note);
    }
    return fail(response, 404, 'NOT_FOUND');
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => fail(response, 500, 'INTERNAL'));
  });
}
