// Loads the token signing keys — a list of problems first, then one ConfigError.
import { ConfigError } from './config-error.js';

// Values that only stand in for a real key — the last one is what sample.env ships with.
export const PLACEHOLDERS = ['changeme', 'secret', 'password', 'replace-me-with-32-random-bytes-in-base64url'];

function problemWith(value) {
  if (!value) return 'is not set';
  if (PLACEHOLDERS.includes(value.toLowerCase())) return 'is a placeholder value';
  if (value.length < 32) return 'is too short';
  return null;
}

export function loadSecrets(env) {
  const currentProblem = problemWith(env.SESSION_SECRET);
  if (currentProblem) throw new ConfigError(`SESSION_SECRET ${currentProblem}`);
  if (!('SESSION_SECRET_PREVIOUS' in env)) return { current: env.SESSION_SECRET, previous: null, previousUntil: null };

  const previousProblem = problemWith(env.SESSION_SECRET_PREVIOUS);
  if (previousProblem) throw new ConfigError(`SESSION_SECRET_PREVIOUS ${previousProblem}`);
  const until = new Date(env.SESSION_SECRET_PREVIOUS_UNTIL ?? 'missing').getTime();
  if (!Number.isFinite(until)) throw new ConfigError('SESSION_SECRET_PREVIOUS_UNTIL is not a date');
  return { current: env.SESSION_SECRET, previous: env.SESSION_SECRET_PREVIOUS, previousUntil: until };
}

export function keysFor({ current, previous, previousUntil }, now) {
  return [current, ...(previous && now < previousUntil ? [previous] : [])];
}
