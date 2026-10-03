import { wait } from './wait.js';

const named = (name) => Object.assign(new Error(name), { name });

// Wrong on purpose: "fetch gives up by itself" — there is no deadline, a silent server hangs forever.
export async function fetchWithRetry(url, { fetchFn, timeoutMs = 5000, maxAttempts = 3, baseDelayMs = 300, signal } = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal?.aborted) throw named('AbortError');
    try {
      const response = await fetchFn(url, { signal });
      if (response.status < 500 || attempt === maxAttempts) return response;
    } catch (error) {
      if (signal?.aborted) throw named('AbortError');
      if (attempt === maxAttempts) throw error;
    }
    await wait(baseDelayMs * 2 ** (attempt - 1), signal);
  }
}
