// What went wrong, and whether to try again.

// failure is one of:
//   - an Error named 'OfflineError' (the adapter said there is no network, nothing was sent);
//   - what fetch rejected with: a TypeError (no connection) or an Error named 'TimeoutError';
//   - a Response whose `ok` is false (the server answered with an error status);
//   - an Error named 'InvalidResponseError' (status 200, but the body broke the contract).
// Returns 'offline' | 'unavailable' | 'http' | 'invalid'.
export function classifyFailure(failure) {
  if (failure instanceof Response) return 'http';
  if (failure?.name === 'OfflineError') return 'offline';
  if (failure?.name === 'InvalidResponseError') return 'invalid';
  if (failure instanceof TypeError || failure?.name === 'TimeoutError') return 'unavailable';
  throw new Error(`not a failure this policy knows: ${failure}`);
}

// Methods whose repeat leaves the server in the same state as one request.
const IDEMPOTENT = ['GET', 'HEAD', 'PUT', 'DELETE'];

// kind — what classifyFailure returned; request — { method, status, idempotencyKey }.
// Returns true when retrying this request is worth it and safe.
export function shouldRetry(kind, request) {
  // Mistake: keeps hammering while there is no network at all.
  const worthIt = kind === 'unavailable' || kind === 'offline' || (kind === 'http' && request.status >= 500);
  if (!worthIt) return false; // offline: wait for the network; invalid and 4xx: the same answer would come again
  return IDEMPOTENT.includes(request.method) || Boolean(request.idempotencyKey);
}
