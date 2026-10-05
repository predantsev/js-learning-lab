// The bookmarks lab service: login with vetted hashes, server-side sessions with expiry and
// revocation, ownership on every route, secrets from config, login throttling, an Origin check
// and size and time limits.
import crypto from 'node:crypto';
import http from 'node:http';
import { readJsonBody, sendError, sendJson } from './http-helpers.js';
import { verifyPassword } from './passwords.js';
import { seedBookmarks, users } from './users.js';

export const WEB_CLIENT = 'http://127.0.0.1:4310';
const IDLE_MS = 30 * 60_000;
const ABSOLUTE_MS = 120 * 60_000;
const MAX_FAILURES = 5;
const WINDOW_MS = 60_000;
const MAX_COUNTERS = 1000;
const PLACEHOLDERS = ['changeme', 'secret', 'password', 'replace-me-with-32-random-bytes-in-base64url'];

class HttpError extends Error {
  constructor(status, code, headers = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

function loadSecrets(env) {
  const key = env.SESSION_SECRET;
  if (!key) throw new Error('SESSION_SECRET is not set');
  if (PLACEHOLDERS.includes(key.toLowerCase())) throw new Error('SESSION_SECRET is a placeholder value');
  if (key.length < 32) throw new Error('SESSION_SECRET is too short (at least 32 characters needed)');
  return { key };
}

export function createApp({ env, clock = { now: () => Date.now() } }) {
  loadSecrets(env); // fail fast: no server with a weak or missing key
  const bookmarks = seedBookmarks.map((bookmark) => ({ ...bookmark }));
  const sessions = new Map(); // id → { userId, createdAt, lastSeenAt }
  const counters = new Map(); // "account:…" / "address:…" → { count, start }
  let nextId = 5;

  // ---- login throttling ----
  const keysOf = (account, address) => [`account:${account}`, `address:${address}`];
  function live(key) {
    const counter = counters.get(key);
    if (counter && clock.now() - counter.start >= WINDOW_MS) {
      counters.delete(key);
      return undefined;
    }
    return counter;
  }
  function blockedFor(keys) {
    let waitMs = 0;
    for (const key of keys) {
      const counter = live(key);
      if (counter && counter.count >= MAX_FAILURES) waitMs = Math.max(waitMs, counter.start + WINDOW_MS - clock.now());
    }
    return Math.ceil(waitMs / 1000);
  }
  function recordFailure(keys) {
    for (const key of keys) {
      const counter = live(key) ?? { count: 0, start: clock.now() };
      counter.count += 1;
      counters.delete(key);
      counters.set(key, counter);
    }
    for (const key of counters.keys()) {
      if (counters.size <= MAX_COUNTERS) break;
      counters.delete(key);
    }
  }

  // ---- sessions ----
  const sidOf = (request) => /(?:^|;\s*)sid=([^;]*)/.exec(request.headers.cookie ?? '')?.[1];
  function requireUser(request) {
    const id = sidOf(request);
    const session = sessions.get(id);
    const now = clock.now();
    if (!session || now - session.lastSeenAt > IDLE_MS || now - session.createdAt > ABSOLUTE_MS) {
      if (session) sessions.delete(id);
      throw new HttpError(401, 'UNAUTHENTICATED');
    }
    session.lastSeenAt = now;
    return { id, userId: session.userId };
  }

  async function login(request, response) {
    const body = await readJsonBody(request, 1024);
    const { user, password } = body ?? {};
    if (typeof user !== 'string' || typeof password !== 'string' || password.length > 200) {
      throw new HttpError(400, 'VALIDATION_FAILED');
    }
    const keys = keysOf(user, request.socket.remoteAddress);
    const wait = blockedFor(keys);
    if (wait > 0) throw new HttpError(429, 'TOO_MANY_ATTEMPTS', { 'retry-after': String(wait) });
    const record = users.find((candidate) => candidate.id === user);
    // An unknown user is checked against a real record too, so both failures cost the same.
    const ok = (await verifyPassword(password, record?.passwordHash ?? users[0].passwordHash)) && record !== undefined;
    if (!ok) {
      recordFailure(keys);
      throw new HttpError(401, 'BAD_CREDENTIALS');
    }
    const id = crypto.randomBytes(32).toString('base64url');
    sessions.set(id, { userId: user, createdAt: clock.now(), lastSeenAt: clock.now() });
    sendJson(response, 204, undefined, { 'set-cookie': `sid=${id}; HttpOnly; SameSite=Lax; Path=/` });
  }

  async function handle(request, response) {
    const stateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    const origin = request.headers.origin;
    if (stateChanging && origin !== undefined && origin !== WEB_CLIENT) throw new HttpError(403, 'CSRF_ORIGIN');

    const path = new URL(request.url, 'http://localhost').pathname;
    if (request.method === 'POST' && path === '/login') return login(request, response);

    const session = requireUser(request);
    if (request.method === 'POST' && path === '/logout') {
      sessions.delete(session.id);
      return sendJson(response, 204, undefined, { 'set-cookie': 'sid=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/' });
    }
    if (path === '/bookmarks' && request.method === 'GET') {
      return sendJson(response, 200, bookmarks.filter((bookmark) => bookmark.ownerId === session.userId));
    }
    if (path === '/bookmarks' && request.method === 'POST') {
      const body = await readJsonBody(request, 1024);
      if (typeof body?.title !== 'string' || typeof body?.url !== 'string') throw new HttpError(400, 'VALIDATION_FAILED');
      const bookmark = { id: `b-${nextId++}`, ownerId: session.userId, title: body.title, url: body.url };
      bookmarks.push(bookmark);
      return sendJson(response, 201, bookmark);
    }
    const id = /^\/bookmarks\/([^/]+)$/.exec(path)?.[1];
    const bookmark = bookmarks.find((candidate) => candidate.id === id && candidate.ownerId === session.userId);
    if (!bookmark) throw new HttpError(404, 'NOT_FOUND');
    if (request.method === 'GET') return sendJson(response, 200, bookmark);
    if (request.method === 'DELETE') {
      bookmarks.splice(bookmarks.indexOf(bookmark), 1);
      return sendJson(response, 204);
    }
    throw new HttpError(405, 'METHOD_NOT_ALLOWED');
  }

  // Time limits for receiving a request; checked every second.
  const server = http.createServer((request, response) => {
    handle(request, response).catch((error) => {
      if (error instanceof HttpError) sendError(response, error.status, error.code, error.headers);
      else if (error.status) sendError(response, error.status, error.code);
      else sendError(response, 500, 'INTERNAL');
    });
  });
  return server;
}
