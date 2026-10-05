import { wait } from './wait.js';

// Sends a GET to `url` through `fetchFn` and retries only failures that are safe to repeat.
// The rules are in the task.
export async function fetchWithRetry(url, { fetchFn, timeoutMs = 5000, maxAttempts = 3, baseDelayMs = 300, signal } = {}) {
  // TODO: replace this single attempt with the retry policy.
  return fetchFn(url, { signal });
}
