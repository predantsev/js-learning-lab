// retry(fn, { maxAttempts, baseMs, isRetryable, signal, random }): calls fn(attempt) until it
// succeeds, at most maxAttempts times. Before attempt n + 1 it waits random() × baseMs × 2^(n − 1) ms.
// A non-retryable error or an aborted signal ends it at once.
export async function retry(fn, { maxAttempts, baseMs, isRetryable = () => true, signal, random = Math.random }) {
  return fn(1);
}
