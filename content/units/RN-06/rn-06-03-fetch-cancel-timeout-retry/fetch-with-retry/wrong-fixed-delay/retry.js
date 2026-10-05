import { wait } from './wait.js';

const named = (name) => Object.assign(new Error(name), { name });

// Wrong on purpose: every retry waits the same time, so a struggling server gets no breathing room.
export async function fetchWithRetry(url, { fetchFn, timeoutMs = 5000, maxAttempts = 3, baseDelayMs = 300, signal } = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal?.aborted) throw named('AbortError');
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const forward = () => controller.abort();
    signal?.addEventListener('abort', forward);
    try {
      const response = await fetchFn(url, { signal: controller.signal });
      if (response.status < 500 || attempt === maxAttempts) return response;
    } catch (error) {
      if (signal?.aborted) throw named('AbortError');
      if (attempt === maxAttempts) throw timedOut ? named('TimeoutError') : error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', forward);
    }
    await wait(baseDelayMs, signal);
  }
}
