// Mistake: no jitter — every client that failed together retries together, at the same instants.
// retry(fn, { maxAttempts, baseMs, isRetryable, signal, random }): calls fn(attempt) until it
// succeeds, at most maxAttempts times. Before attempt n + 1 it waits random() × baseMs × 2^(n − 1) ms.
// A non-retryable error or an aborted signal ends it at once.
function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function retry(fn, { maxAttempts, baseMs, isRetryable = () => true, signal, random = Math.random }) {
  for (let attempt = 1; ; attempt++) {
    signal?.throwIfAborted();
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryable(error)) throw error;
      // Full jitter: a random point between 0 and the exponential delay.
      await wait(baseMs * 2 ** (attempt - 1), signal);
    }
  }
}
