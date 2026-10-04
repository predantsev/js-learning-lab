// Loads the token signing keys from an environment object (process.env on a real start).
import { ConfigError } from './config-error.js';

// Values that only stand in for a real key — the last one is what sample.env ships with.
export const PLACEHOLDERS = ['changeme', 'secret', 'password', 'replace-me-with-32-random-bytes-in-base64url'];

// Checks one key; the message names the variable, never the value.
function requireStrong(name, value) {
  if (value === undefined || value === '') throw new ConfigError(`${name} is not set`);
  if (PLACEHOLDERS.includes(value.toLowerCase())) throw new ConfigError(`${name} is a placeholder value`);
  if (value.length < 32) throw new ConfigError(`${name} is too short (at least 32 characters needed)`);
  return value;
}

// Returns { current, previous, previousUntil }:
//   current        — SESSION_SECRET (required)
//   previous       — SESSION_SECRET_PREVIOUS, or null when it is not set
//   previousUntil  — SESSION_SECRET_PREVIOUS_UNTIL as milliseconds (Date.parse), or null
// Throws a ConfigError for anything missing or weak.
export function loadSecrets(env) {
  const current = requireStrong('SESSION_SECRET', env.SESSION_SECRET);
  if (env.SESSION_SECRET_PREVIOUS === undefined) return { current, previous: null, previousUntil: null };

  const previous = requireStrong('SESSION_SECRET_PREVIOUS', env.SESSION_SECRET_PREVIOUS);
  const previousUntil = Date.parse(env.SESSION_SECRET_PREVIOUS_UNTIL ?? '');
  if (Number.isNaN(previousUntil)) {
    throw new ConfigError('SESSION_SECRET_PREVIOUS_UNTIL must be a date when SESSION_SECRET_PREVIOUS is set');
  }
  return { current, previous, previousUntil };
}

// The keys a token may be verified with at the moment `now` (milliseconds):
// always `current`; `previous` too, but only while now < previousUntil.
export function keysFor(secrets, now) {
  if (secrets.previous !== null) return [secrets.current, secrets.previous];
  return [secrets.current];
}
