import { wait } from './wait.js';

function namedError(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}

// Sends a GET to `url` through `fetchFn` and retries only failures that are safe to repeat.
export async function fetchWithRetry(url, { fetchFn, timeoutMs = 5000, maxAttempts = 3, baseDelayMs = 300, signal } = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal?.aborted) throw namedError('AbortError', 'Aborted');

    // Every attempt has its own controller: the timeout or the outer signal aborts it.
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const forwardAbort = () => controller.abort();
    signal?.addEventListener('abort', forwardAbort);

    try {
      const response = await fetchFn(url, { signal: controller.signal });
      // ok and 4xx answers will not change if asked again; the last attempt returns whatever came.
      if (response.status < 500 || attempt === maxAttempts) return response;
    } catch (error) {
      if (signal?.aborted) throw namedError('AbortError', 'Aborted');
      const failure = timedOut ? namedError('TimeoutError', `No answer within ${timeoutMs} ms`) : error;
      if (attempt === maxAttempts) throw failure;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', forwardAbort);
    }

    await wait(baseDelayMs * 2 ** (attempt - 1), signal); // rejects at once if the screen goes away
  }
}
