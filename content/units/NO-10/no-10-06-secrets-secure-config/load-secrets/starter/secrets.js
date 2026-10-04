// Loads the token signing keys from an environment object (process.env on a real start).
import { ConfigError } from './config-error.js';

// Values that only stand in for a real key — the last one is what sample.env ships with.
export const PLACEHOLDERS = ['changeme', 'secret', 'password', 'replace-me-with-32-random-bytes-in-base64url'];

// Returns { current, previous, previousUntil }:
//   current        — SESSION_SECRET (required)
//   previous       — SESSION_SECRET_PREVIOUS, or null when it is not set
//   previousUntil  — SESSION_SECRET_PREVIOUS_UNTIL as milliseconds (Date.parse), or null
// Throws a ConfigError for anything missing or weak.
export function loadSecrets(env) {
  // TODO
  return { current: env.SESSION_SECRET, previous: null, previousUntil: null };
}

// The keys a token may be verified with at the moment `now` (milliseconds):
// always `current`; `previous` too, but only while now < previousUntil.
export function keysFor(secrets, now) {
  // TODO
  return [secrets.current];
}
