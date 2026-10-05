// One request for the expenses, cancelled when the screen goes away or when timeoutMs passes.
export async function loadRecords(url, { fetchFn, timeoutMs = 5000, signal } = {}) {
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
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (timedOut) throw Object.assign(new Error(`No answer within ${timeoutMs} ms`), { name: 'TimeoutError' });
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
