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
  // Mistake: trusts the server — "it sends the same shape as the fixtures anyway".
  function checked(value) {
    return value;
  }

  return {
    async listRecords() {
      const body = await send('GET', '/v1/records');
      if (!Array.isArray(body)) throw new Error('the server did not answer a list');
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
