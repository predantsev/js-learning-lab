// The bookmarks lab service, another way: a sliding log of failure times per key, sessions that
// store their two deadlines, and small route functions in a table.
import crypto from 'node:crypto';
import http from 'node:http';
import { readJsonBody, sendError, sendJson } from './http-helpers.js';
import { verifyPassword } from './passwords.js';
import { seedBookmarks, users } from './users.js';

export const WEB_CLIENT = 'http://127.0.0.1:4310';
const MINUTE = 60_000;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const WEAK_KEYS = new Set(['changeme', 'secret', 'password', 'replace-me-with-32-random-bytes-in-base64url']);

// A refusal with a status, a stable code and optional headers.
const refuse = (status, code, headers = {}) => Object.assign(new Error(code), { status, code, headers });

function requireStrongKey(value) {
  if (typeof value !== 'string' || value === '') throw new Error('SESSION_SECRET is missing');
  if (WEAK_KEYS.has(value.toLowerCase())) throw new Error('SESSION_SECRET is a known placeholder');
  if (value.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters long');
}

// At most `limit` failures per key within `windowMs`, as a list of failure times per key.
function createFailureLog({ limit, windowMs, maxKeys, now }) {
  const log = new Map();
  const recent = (key) => (log.get(key) ?? []).filter((time) => now() - time < windowMs);
  return {
    secondsToWait(keys) {
      let wait = 0;
      for (const key of keys) {
        const times = recent(key);
        if (times.length >= limit) wait = Math.max(wait, times[times.length - limit] + windowMs - now());
      }
      return Math.ceil(wait / 1000);
    },
    add(keys) {
      for (const key of keys) {
        const times = recent(key);
        log.delete(key);
        log.set(key, [...times, now()]);
      }
      while (log.size > maxKeys) log.delete(log.keys().next().value);
    },
  };
}

export function createApp({ env, clock = { now: () => Date.now() } }) {
  requireStrongKey(env.SESSION_SECRET);
  const now = () => clock.now();
  const failures = createFailureLog({ limit: 5, windowMs: MINUTE, maxKeys: 1000, now });
  const sessions = new Map(); // id → { userId, idleUntil, hardUntil }
  const bookmarks = seedBookmarks.map((bookmark) => ({ ...bookmark }));
  let counter = 4;

  function sessionOf(request) {
    const id = (request.headers.cookie ?? '')
      .split(';')
      .map((part) => part.trim().split('='))
      .find(([name]) => name === 'sid')?.[1];
    const session = sessions.get(id);
    if (!session || now() > session.idleUntil || now() > session.hardUntil) {
      sessions.delete(id);
      throw refuse(401, 'UNAUTHENTICATED');
    }
    session.idleUntil = now() + 30 * MINUTE;
    return { id, ...session };
  }

  async function login(request) {
    const { user, password } = (await readJsonBody(request, 1024)) ?? {};
    if (typeof user !== 'string' || typeof password !== 'string' || password.length > 200) throw refuse(400, 'VALIDATION_FAILED');
    const keys = [`user ${user}`, `ip ${request.socket.remoteAddress}`];
    const wait = failures.secondsToWait(keys);
    if (wait > 0) throw refuse(429, 'TOO_MANY_ATTEMPTS', { 'retry-after': String(wait) });
    const known = users.find((candidate) => candidate.id === user);
    const matches = await verifyPassword(password, (known ?? users[0]).passwordHash);
    if (!known || !matches) {
      failures.add(keys);
      throw refuse(401, 'BAD_CREDENTIALS');
    }
    const id = crypto.randomBytes(32).toString('hex');
    sessions.set(id, { userId: user, idleUntil: now() + 30 * MINUTE, hardUntil: now() + 120 * MINUTE });
    return { status: 204, headers: { 'set-cookie': `sid=${id}; Path=/; HttpOnly; SameSite=Lax` } };
  }

  const routes = {
    'POST /login': (request) => login(request),
    'POST /logout': (request) => {
      sessions.delete(sessionOf(request).id);
      return { status: 204, headers: { 'set-cookie': 'sid=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax' } };
    },
    'GET /bookmarks': (request) => {
      const { userId } = sessionOf(request);
      return { status: 200, body: bookmarks.filter((bookmark) => bookmark.ownerId === userId) };
    },
    'POST /bookmarks': async (request) => {
      const { userId } = sessionOf(request);
      const { title, url } = (await readJsonBody(request, 4096)) ?? {};
      if (typeof title !== 'string' || typeof url !== 'string') throw refuse(400, 'VALIDATION_FAILED');
      counter += 1;
      const bookmark = { id: `b-${counter}`, ownerId: userId, title, url };
      bookmarks.push(bookmark);
      return { status: 201, body: bookmark };
    },
  };

  async function oneBookmark(request, id) {
    const { userId } = sessionOf(request);
    const index = bookmarks.findIndex((bookmark) => bookmark.id === id && bookmark.ownerId === userId);
    if (index === -1) throw refuse(404, 'NOT_FOUND');
    if (request.method === 'GET') return { status: 200, body: bookmarks[index] };
    if (request.method === 'DELETE') {
      bookmarks.splice(index, 1);
      return { status: 204 };
    }
    throw refuse(405, 'METHOD_NOT_ALLOWED');
  }

  async function handle(request) {
    const origin = request.headers.origin;
    if (!SAFE_METHODS.has(request.method) && origin !== undefined && origin !== WEB_CLIENT) throw refuse(403, 'CSRF_ORIGIN');
    const { pathname } = new URL(request.url, 'http://localhost');
    const route = routes[`${request.method} ${pathname}`];
    if (route) return route(request);
    const id = /^\/bookmarks\/([^/]+)$/.exec(pathname)?.[1];
    if (id) return oneBookmark(request, id);
    throw refuse(404, 'NOT_FOUND');
  }

  const server = http.createServer((request, response) => {
    handle(request).then(
      ({ status, body, headers = {} }) => sendJson(response, status, body, headers),
      (error) => sendError(response, error.status ?? 500, error.status ? error.code : 'INTERNAL', error.headers ?? {}),
    );
  });
  server.requestTimeout = 4000;
  server.headersTimeout = 4000;
  return server;
}
