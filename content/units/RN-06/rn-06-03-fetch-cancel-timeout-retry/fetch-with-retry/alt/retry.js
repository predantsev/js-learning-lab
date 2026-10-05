import { wait } from './wait.js';

const abortError = () => Object.assign(new Error('Aborted'), { name: 'AbortError' });

// One attempt with its own deadline. Resolves { response } or { error }, never rejects.
async function attemptOnce(url, fetchFn, timeoutMs, outer) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onOuterAbort = () => controller.abort();
  outer?.addEventListener('abort', onOuterAbort);
  try {
    return { response: await fetchFn(url, { signal: controller.signal }) };
  } catch (error) {
    return { error: timedOut ? Object.assign(new Error('timed out'), { name: 'TimeoutError' }) : error };
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', onOuterAbort);
  }
}

// The same policy written recursively: attempt, decide, wait, call itself with one attempt fewer.
export async function fetchWithRetry(url, { fetchFn, timeoutMs = 5000, maxAttempts = 3, baseDelayMs = 300, signal } = {}) {
  if (signal?.aborted) throw abortError();
  const { response, error } = await attemptOnce(url, fetchFn, timeoutMs, signal);
  if (signal?.aborted) throw abortError();
  const retryable = error !== undefined || response.status >= 500;
  if (!retryable || maxAttempts <= 1) {
    if (error !== undefined) throw error;
    return response;
  }
  await wait(baseDelayMs, signal);
  return fetchWithRetry(url, { fetchFn, timeoutMs, maxAttempts: maxAttempts - 1, baseDelayMs: baseDelayMs * 2, signal });
}
