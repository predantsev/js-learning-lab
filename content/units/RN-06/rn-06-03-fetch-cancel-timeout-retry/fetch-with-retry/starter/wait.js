// Resolves after `ms` milliseconds — or rejects at once with an AbortError when `signal` aborts,
// and then clears its timer, so an aborted wait leaves nothing behind.
export function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const aborted = () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      return error;
    };
    if (signal?.aborted) {
      reject(aborted());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(aborted());
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
