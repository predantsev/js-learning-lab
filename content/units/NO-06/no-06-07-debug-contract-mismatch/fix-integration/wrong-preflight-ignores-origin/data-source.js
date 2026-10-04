// The client's HTTP data source.
import { parseWishV1 } from './contract.js';

function checked(wish) {
  const errors = parseWishV1(wish);
  if (errors.length > 0) throw Object.assign(new Error(errors.join('; ')), { name: 'InvalidResponseError' });
  return wish;
}

export function createDataSource({ baseUrl }) {
  return {
    async listRecords() {
      const response = await fetch(`${baseUrl}/v1/records`, { signal: AbortSignal.timeout(2000) });
      if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status });
      const body = await response.json();
      if (!Array.isArray(body)) throw Object.assign(new Error('expected a list'), { name: 'InvalidResponseError' });
      return body.map(checked);
    },
    async updateRecord(id, changes) {
      const response = await fetch(`${baseUrl}/v1/records/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(changes),
        signal: AbortSignal.timeout(2000),
      });
      if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status });
      return checked(await response.json());
    },
  };
}
