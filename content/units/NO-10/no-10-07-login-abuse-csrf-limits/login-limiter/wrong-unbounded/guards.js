// Login throttling and the CSRF Origin check for the wishlist lab service.
import { HttpError } from './http-error.js';

// Counts failed logins per account AND per address (separate counters).
// Options: maxFailures (5), windowMs (60 000), maxEntries (1000), now (a clock function).
//   blockedFor(account, address) → whole seconds until a new attempt is allowed (0 = allowed now)
//   recordFailure(account, address)
//   size() → how many counters are kept right now
export function createLoginLimiter({ maxFailures = 5, windowMs = 60_000, maxEntries = 1000, now = Date.now } = {}) {
  const counters = new Map(); // "account:…" / "address:…" → { count, start }
  const keysOf = (account, address) => [`account:${account}`, `address:${address}`];

  // A counter whose window has passed is gone.
  function live(key) {
    const counter = counters.get(key);
    if (counter && now() - counter.start >= windowMs) {
      counters.delete(key);
      return undefined;
    }
    return counter;
  }

  return {
    blockedFor(account, address) {
      let waitMs = 0;
      for (const key of keysOf(account, address)) {
        const counter = live(key);
        if (counter && counter.count >= maxFailures) waitMs = Math.max(waitMs, counter.start + windowMs - now());
      }
      return Math.ceil(waitMs / 1000);
    },
    recordFailure(account, address) {
      for (const key of keysOf(account, address)) {
        const counter = live(key) ?? { count: 0, start: now() };
        counter.count += 1;
        counters.delete(key); // re-insert, so the Map's order is "least recently failed first"
        counters.set(key, counter);
      }
      // Bounded memory: drop the oldest counters (a Map iterates in insertion order).
    },
    size() {
      return counters.size;
    },
  };
}

// For a state-changing request (any method except GET, HEAD and OPTIONS): when the
// request has an Origin header that is not in allowedOrigins, throw new HttpError(403, 'CSRF_ORIGIN').
// A request without an Origin header passes (it does not come from a page in a browser).
export function requireSameOrigin(request, allowedOrigins) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  const origin = request.headers.origin;
  if (origin !== undefined && !allowedOrigins.includes(origin)) throw new HttpError(403, 'CSRF_ORIGIN');
}
