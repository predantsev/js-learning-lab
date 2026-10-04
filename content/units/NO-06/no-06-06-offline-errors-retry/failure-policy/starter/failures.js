// What went wrong, and whether to try again.

// failure is one of:
//   - an Error named 'OfflineError' (the adapter said there is no network, nothing was sent);
//   - what fetch rejected with: a TypeError (no connection) or an Error named 'TimeoutError';
//   - a Response whose `ok` is false (the server answered with an error status);
//   - an Error named 'InvalidResponseError' (status 200, but the body broke the contract).
// Returns 'offline' | 'unavailable' | 'http' | 'invalid'.
export function classifyFailure(failure) {
  // TODO
  return 'unavailable';
}

// kind — what classifyFailure returned; request — { method, status, idempotencyKey }.
// Returns true when retrying this request is worth it and safe.
export function shouldRetry(kind, request) {
  // TODO
  return false;
}
