// Login throttling and the CSRF Origin check for the wishlist lab service.
import { HttpError } from './http-error.js';

// Counts failed logins per account AND per address (separate counters).
// Options: maxFailures (5), windowMs (60 000), maxEntries (1000), now (a clock function).
//   blockedFor(account, address) → whole seconds until a new attempt is allowed (0 = allowed now)
//   recordFailure(account, address)
//   size() → how many counters are kept right now
export function createLoginLimiter({ maxFailures = 5, windowMs = 60_000, maxEntries = 1000, now = Date.now } = {}) {
  const counters = new Map(); // "account:…" / "address:…" → { count, start }

  return {
    blockedFor(account, address) {
      // TODO
      return 0;
    },
    recordFailure(account, address) {
      // TODO
    },
    size() {
      return counters.size;
    },
  };
}

// For a state-changing request (any method except GET, HEAD and OPTIONS): when the
// request has an Origin header that is not in allowedOrigins, throw new HttpError(403, 'CSRF_ORIGIN').
// A request without an Origin header passes (a modern browser sends Origin with every POST from a page).
export function requireSameOrigin(request, allowedOrigins) {
  // TODO
}
