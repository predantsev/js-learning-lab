// The lab notes service in two modes:
//   'session' — an opaque random id in a cookie, the state lives in a server-side Map;
//   'token'   — a signed token (payload.signature) in the Authorization header, no lookup.
// The signed token is a teaching model of the idea behind JWT; a real project takes a vetted
// library instead of its own token format.
import crypto from 'node:crypto';
import http from 'node:http';
import { readJsonBody, sendEmpty, sendError, sendJson } from './http-helpers.js';
import { checkPassword } from './users.js';

const notesOf = {
  'u-01': [{ id: 'n-1', title: '%%gifts%%' }],
  'u-02': [{ id: 'n-2', title: '%%shopping%%' }],
};

export function createApp({ mode }) {
  const sessions = new Map(); // session id → { userId, createdAt }
  const signingKey = crypto.randomBytes(32); // lesson 6: where a real key comes from

  const sign = (payload) => crypto.createHmac('sha256', signingKey).update(payload).digest('base64url');

  function issueToken(userId) {
    const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Date.now() + 60 * 60 * 1000 })).toString('base64url');
    return `${payload}.${sign(payload)}`;
  }

  function userFromToken(header) {
    const [payload, signature] = /^Bearer (\S+)$/.exec(header ?? '')?.[1].split('.') ?? [];
    if (!payload || !signature) return null;
    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(signature);
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims.exp > Date.now() ? claims.sub : null;
  }

  // "theme=dark; sid=abc" → "abc"
  function sidFromCookie(header) {
    const pair = (header ?? '').split(';').map((part) => part.trim()).find((part) => part.startsWith('sid='));
    return pair?.slice(4);
  }
  const userFromCookie = (header) => sessions.get(sidFromCookie(header))?.userId ?? null;

  async function handle(request, response) {
    const path = new URL(request.url, 'http://localhost').pathname;

    if (request.method === 'POST' && path === '/login') {
      const body = await readJsonBody(request);
      if (!checkPassword(body?.userId, body?.password)) return sendError(response, 401, 'BAD_CREDENTIALS');
      if (mode === 'token') return sendJson(response, 200, { token: issueToken(body.userId) });
      const id = crypto.randomBytes(32).toString('base64url'); // opaque: says nothing about the user
      sessions.set(id, { userId: body.userId, createdAt: Date.now() });
      return sendEmpty(response, 204, { 'set-cookie': `sid=${id}; HttpOnly; SameSite=Lax; Path=/` });
    }

    const userId = mode === 'token' ? userFromToken(request.headers.authorization) : userFromCookie(request.headers.cookie);
    // A cookie session has no standard WWW-Authenticate scheme; the header is sent in token mode only.
    if (!userId) return sendError(response, 401, 'UNAUTHENTICATED', mode === 'token' ? { 'www-authenticate': 'Bearer' } : {});

    if (request.method === 'POST' && path === '/logout') {
      if (mode === 'session') sessions.delete(sidFromCookie(request.headers.cookie));
      // Token mode: there is nothing to delete — the server keeps no state about tokens.
      return sendEmpty(response, 204, mode === 'session' ? { 'set-cookie': 'sid=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/' } : {});
    }
    if (request.method === 'GET' && path === '/notes') return sendJson(response, 200, notesOf[userId]);
    return sendError(response, 404, 'NOT_FOUND');
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => sendError(response, 500, 'INTERNAL'));
  });
}
