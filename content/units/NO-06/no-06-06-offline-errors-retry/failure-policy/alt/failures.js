// The same policy written as a lookup table.
const BY_NAME = { OfflineError: 'offline', InvalidResponseError: 'invalid', TypeError: 'unavailable', TimeoutError: 'unavailable' };

export function classifyFailure(failure) {
  if (typeof failure?.status === 'number' && failure.ok === false) return 'http';
  const kind = BY_NAME[failure?.name];
  if (kind === undefined) throw new Error('unknown failure');
  return kind;
}

const RETRY = {
  offline: () => false,
  invalid: () => false,
  unavailable: () => true,
  http: (request) => request.status >= 500 && request.status <= 599,
};
const SAFE_TO_REPEAT = new Set(['GET', 'HEAD', 'PUT', 'DELETE']);

export function shouldRetry(kind, request) {
  if (!RETRY[kind](request)) return false;
  if (SAFE_TO_REPEAT.has(request.method)) return true;
  return typeof request.idempotencyKey === 'string' && request.idempotencyKey !== '';
}
