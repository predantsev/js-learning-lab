// One request for the expenses, cancelled when the screen goes away or when timeoutMs passes.
export function loadRecords(url, { fetchFn, timeoutMs = 5000, signal } = {}) {
  const controller = new AbortController();
  signal?.addEventListener('abort', () => controller.abort(), { once: true });
  let timer;
  const deadline = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(Object.assign(new Error('timed out'), { name: 'TimeoutError' }));
    }, timeoutMs);
  });
  const request = fetchFn(url, { signal: controller.signal }).then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });
  request.catch(() => {}); // the deadline may win the race; its loser must not become an unhandled rejection
  return Promise.race([request, deadline]).finally(() => clearTimeout(timer));
}
