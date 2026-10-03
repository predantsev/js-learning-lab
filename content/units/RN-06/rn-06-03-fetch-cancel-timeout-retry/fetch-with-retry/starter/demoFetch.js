// A stand-in for the mock service with ?fail=2: the first two calls answer 503, then 200.
// It honours the signal it is given, like a real fetch.
export function flakyFetch() {
  let calls = 0;
  return (url, { signal } = {}) => {
    calls += 1;
    const status = calls <= 2 ? 503 : 200;
    console.log(`attempt ${calls} → ${status}`);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(new Response('[]', { status })), 20);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        const error = new Error('Aborted');
        error.name = 'AbortError';
        reject(error);
      });
    });
  };
}
