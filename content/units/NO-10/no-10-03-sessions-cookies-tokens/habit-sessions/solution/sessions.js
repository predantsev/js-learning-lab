// Server-side sessions for the habit tracker lab.
import crypto from 'node:crypto';

// The session store: session id → { userId, createdAt }. It lives only in this process.
const sessions = new Map();

// Creates a session for userId and returns { id, cookie }:
// `cookie` is the value of the Set-Cookie header that carries the id as "sid".
export function createSession(userId) {
  const id = crypto.randomBytes(32).toString('base64url'); // 256 random bits, nothing about the user
  sessions.set(id, { userId, createdAt: Date.now() });
  return { id, cookie: `sid=${id}; HttpOnly; SameSite=Lax; Path=/` };
}

// Returns { id, userId } of the session named by the request's "sid" cookie, or null.
export function readSession(request) {
  const header = request.headers.cookie ?? '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== 'sid') continue;
    const id = rest.join('=');
    const session = sessions.get(id);
    return session ? { id, userId: session.userId } : null;
  }
  return null;
}

// Logout: forgets the session on the server.
export function destroySession(id) {
  sessions.delete(id);
}
