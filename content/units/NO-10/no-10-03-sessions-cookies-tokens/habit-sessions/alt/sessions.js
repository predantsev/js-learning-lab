// Server-side sessions for the habit tracker lab (regular expression and hex ids).
import { randomBytes } from 'node:crypto';

const sessions = new Map();

const COOKIE_ATTRIBUTES = ['HttpOnly', 'SameSite=Lax', 'Path=/'];

export function createSession(userId) {
  const id = randomBytes(32).toString('hex');
  sessions.set(id, { userId, createdAt: Date.now() });
  return { id, cookie: [`sid=${id}`, ...COOKIE_ATTRIBUTES].join('; ') };
}

export function readSession(request) {
  // "sid" at the start of the header or after "; "
  const match = /(?:^|;\s*)sid=([^;]*)/.exec(request.headers.cookie ?? '');
  if (!match || !sessions.has(match[1])) return null;
  return { id: match[1], userId: sessions.get(match[1]).userId };
}

export function destroySession(id) {
  sessions.delete(id);
}
