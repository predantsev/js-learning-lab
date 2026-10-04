// The expense client's data layer with a bounded retry. A rejected fetch (TypeError) or a timeout
// means "no answer"; only such failures are retried, and a POST only when it carries an idempotency key.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const noAnswer = (error) => error instanceof TypeError || error.name === 'TimeoutError';

export function createExpenseClient({ baseUrl, retries, baseDelayMs = 100 }) {
  let cache = null; // the last list the server answered

  async function withRetry(label, request) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await request();
      } catch (error) {
        if (attempt >= retries || !noAnswer(error)) throw error;
        const delay = baseDelayMs * 2 ** attempt; // 100, 200, 400 ms…
        console.log(`  [client] ${label}: ${error.name}, %%retryIn%% ${delay} ms`);
        await sleep(delay);
      }
    }
  }

  return {
    // Fresh list, or the last copy marked stale. The copy is never thrown away because of a failure.
    async listRecords() {
      try {
        const response = await withRetry('GET', () => fetch(`${baseUrl}/v1/records`, { signal: AbortSignal.timeout(500) }));
        cache = await response.json();
        return { records: cache, stale: false };
      } catch (error) {
        return { records: cache ?? [], stale: true, failure: error.name };
      }
    },
    async createRecord(expense, { idempotencyKey } = {}) {
      const headers = { 'content-type': 'application/json', ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}) };
      const send = () => fetch(`${baseUrl}/v1/records`, { method: 'POST', headers, body: JSON.stringify(expense), signal: AbortSignal.timeout(500) });
      // Without a key a retry could store the expense twice — so then there is no retry at all.
      const response = idempotencyKey ? await withRetry('POST', send) : await send();
      return response.json();
    },
  };
}
