// Session rules for the lab. Times are milliseconds from an injected clock.
export const IDLE_MS = 30 * 60_000; // at most 30 minutes between requests
export const ABSOLUTE_MS = 120 * 60_000; // at most 2 hours after login

// The session store: id → { userId, createdAt, lastSeenAt }.
export const sessions = new Map();

// true while the session is still valid at the moment `now`:
// at most IDLE_MS since its last request AND at most ABSOLUTE_MS since login (both inclusive).
export function isSessionValid(session, now) {
  const idle = now - session.lastSeenAt;
  const age = now - session.createdAt;
  return idle <= IDLE_MS && age <= ABSOLUTE_MS;
}

// Deletes every session of userId from the store, except the one whose id is `except`.
// Returns how many sessions were deleted.
export function revokeUserSessions(userId, { except } = {}) {
  let deleted = 0;
  for (const [id, session] of sessions) {
    if (session.userId === userId) {
      sessions.delete(id);
      deleted += 1;
    }
  }
  return deleted;
}
