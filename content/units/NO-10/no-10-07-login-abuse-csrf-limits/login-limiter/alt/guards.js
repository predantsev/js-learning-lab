// Login throttling with a list of failure times per key (a sliding window), and the Origin check.
import { HttpError } from './http-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function createLoginLimiter({ maxFailures = 5, windowMs = 60_000, maxEntries = 1000, now = Date.now } = {}) {
  const failures = new Map(); // key → [time, time, …]

  const recent = (key) => {
    const times = (failures.get(key) ?? []).filter((time) => now() - time < windowMs);
    if (times.length === 0) failures.delete(key);
    else failures.set(key, times);
    return times;
  };

  return {
    blockedFor(account, address) {
      const waits = [`account:${account}`, `address:${address}`].map((key) => {
        const times = recent(key);
        if (times.length < maxFailures) return 0;
        // Allowed again when the failure that pushed the count over the limit leaves the window.
        return times[times.length - maxFailures] + windowMs - now();
      });
      return Math.ceil(Math.max(...waits) / 1000);
    },
    recordFailure(account, address) {
      for (const key of [`account:${account}`, `address:${address}`]) {
        const times = recent(key);
        failures.delete(key);
        failures.set(key, [...times, now()]);
      }
      while (failures.size > maxEntries) failures.delete(failures.keys().next().value);
    },
    size() {
      return failures.size;
    },
  };
}

export function requireSameOrigin(request, allowedOrigins) {
  const { origin } = request.headers;
  if (!SAFE_METHODS.has(request.method) && origin && !allowedOrigins.includes(origin)) {
    throw new HttpError(403, 'CSRF_ORIGIN');
  }
}
