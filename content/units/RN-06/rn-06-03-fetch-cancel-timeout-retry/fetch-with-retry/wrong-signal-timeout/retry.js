import { wait } from './wait.js';

const named = (name) => Object.assign(new Error(name), { name });

// Wrong on purpose: AbortSignal.timeout and AbortSignal.any work in a browser,
// but React Native 0.86 has neither.
export async function fetchWithRetry(url, { fetchFn, timeoutMs = 5000, maxAttempts = 3, baseDelayMs = 300, signal } = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal?.aborted) throw named('AbortError');
    const deadline = AbortSignal.timeout(timeoutMs);
    const both = signal ? AbortSignal.any([signal, deadline]) : deadline;
    try {
      const response = await fetchFn(url, { signal: both });
      if (response.status < 500 || attempt === maxAttempts) return response;
    } catch (error) {
      if (signal?.aborted) throw named('AbortError');
      if (attempt === maxAttempts) throw deadline.aborted ? named('TimeoutError') : error;
    }
    await wait(baseDelayMs * 2 ** (attempt - 1), signal);
  }
}
