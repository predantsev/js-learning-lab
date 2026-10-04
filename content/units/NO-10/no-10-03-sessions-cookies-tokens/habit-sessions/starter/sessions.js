// Server-side sessions for the habit tracker lab.
import crypto from 'node:crypto';

// The session store: session id → { userId, createdAt }. It lives only in this process.
const sessions = new Map();

// Creates a session for userId and returns { id, cookie }:
// `cookie` is the value of the Set-Cookie header that carries the id as "sid".
export function createSession(userId) {
  // TODO
  return { id: '', cookie: '' };
}

// Returns { id, userId } of the session named by the request's "sid" cookie, or null.
export function readSession(request) {
  // TODO
  return null;
}

// Logout: forgets the session on the server.
export function destroySession(id) {
  sessions.delete(id);
}
