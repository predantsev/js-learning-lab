import { wait } from './wait.js';

const named = (name) => Object.assign(new Error(name), { name });

// Wrong on purpose: the outer abort is treated like a network error, and the wait ignores it,
// so the request is retried after the screen went away.
export async function fetchWithRetry(url, { fetchFn, timeoutMs = 5000, maxAttempts = 3, baseDelayMs = 300, signal } = {}) {
  let failure = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const forward = () => controller.abort();
    signal?.addEventListener('abort', forward);
    try {
      const response = await fetchFn(url, { signal: controller.signal });
      if (response.status < 500 || attempt === maxAttempts) return response;
    } catch (error) {
      failure = timedOut ? named('TimeoutError') : error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', forward);
    }
    if (attempt < maxAttempts) await wait(baseDelayMs * 2 ** (attempt - 1));
  }
  throw failure;
}
