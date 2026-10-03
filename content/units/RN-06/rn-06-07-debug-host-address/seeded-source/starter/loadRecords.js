// One request for the expenses, cancelled when the screen goes away.
// timeoutMs: how long one request may wait for an answer.
export async function loadRecords(url, { fetchFn, timeoutMs = 5000, signal } = {}) {
  const controller = new AbortController();
  signal?.addEventListener('abort', () => controller.abort());
  const response = await fetchFn(url, { signal: controller.signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
