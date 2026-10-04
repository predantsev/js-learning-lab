// The client's HTTP data source.
import { parseWishV1 } from './contract.js';
import { wishFixtures } from './fixtures.js';

function checked(wish) {
  const errors = parseWishV1(wish);
  if (errors.length > 0) throw Object.assign(new Error(errors.join('; ')), { name: 'InvalidResponseError' });
  return wish;
}

export function createDataSource({ baseUrl }) {
  return {
    async listRecords() {
      // While the API was being built, the list came from fixtures — "just for now".
      return wishFixtures();
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
