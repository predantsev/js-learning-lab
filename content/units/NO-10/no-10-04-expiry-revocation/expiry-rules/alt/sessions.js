// Session rules for the lab (expiry moments computed first, filter-based revocation).
export const IDLE_MS = 30 * 60_000;
export const ABSOLUTE_MS = 120 * 60_000;

export const sessions = new Map();

export function isSessionValid(session, now) {
  const idleDeadline = session.lastSeenAt + IDLE_MS;
  const hardDeadline = session.createdAt + ABSOLUTE_MS;
  return now <= Math.min(idleDeadline, hardDeadline);
}

export function revokeUserSessions(userId, { except } = {}) {
  const doomed = [...sessions].filter(([id, session]) => session.userId === userId && id !== except);
  for (const [id] of doomed) sessions.delete(id);
  return doomed.length;
}
