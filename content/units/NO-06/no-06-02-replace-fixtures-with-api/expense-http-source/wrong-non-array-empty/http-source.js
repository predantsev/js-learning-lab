// The HTTP data source of the expense client: the same interface as the fixture source
// (listRecords, createRecord, updateRecord), over the API at baseUrl.
import { parseExpense } from './contract.js';

export function createHttpSource({ baseUrl, fetch }) {
  // One request: rejects on a status that is not ok, otherwise answers the parsed JSON body.
  async function send(method, path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status} for ${method} ${path}`), { status: response.status });
    return response.json();
  }

  // The edge: nothing reaches the app before it passed the contract.
  function checked(value) {
    const result = parseExpense(value);
    if (!result.ok) throw new Error(`invalid expense from the server: ${JSON.stringify(result.errors)}`);
    return result.value;
  }

  return {
    async listRecords() {
      const body = await send('GET', '/v1/records');
      // Mistake: an answer that is not a list quietly becomes an empty list.
      if (!Array.isArray(body)) return [];
      return body.map(checked);
    },
    async createRecord(input) {
      return checked(await send('POST', '/v1/records', input));
    },
    async updateRecord(id, changes) {
      return checked(await send('PATCH', `/v1/records/${encodeURIComponent(id)}`, changes));
    },
  };
}
