// Alternative: the promise version of setTimeout from node:timers/promises, which takes a signal.
import { setTimeout as sleep } from 'node:timers/promises';

export async function retry(fn, { maxAttempts, baseMs, isRetryable = () => true, signal, random = Math.random }) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) throw signal.reason;
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error)) throw error;
    }
    if (attempt < maxAttempts) await sleep(Math.round(baseMs * Math.pow(2, attempt - 1) * random()), undefined, { signal });
  }
  throw lastError;
}
