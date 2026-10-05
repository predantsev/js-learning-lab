// Wrong on purpose: the timer gives up waiting, but never aborts the request itself,
// so the connection stays open in the background.
export function loadRecords(url, { fetchFn, timeoutMs = 5000, signal } = {}) {
  const controller = new AbortController();
  signal?.addEventListener('abort', () => controller.abort());
  const request = fetchFn(url, { signal: controller.signal }).then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });
  const deadline = new Promise((resolve, reject) => {
    setTimeout(() => reject(Object.assign(new Error('timed out'), { name: 'TimeoutError' })), timeoutMs);
  });
  request.catch(() => {});
  return Promise.race([request, deadline]);
}
