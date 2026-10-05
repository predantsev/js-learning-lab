// The HTTP data source of the expense client: the same interface as the fixture source
// (listRecords, createRecord, updateRecord), over the API at baseUrl.
import { parseExpense } from './contract.js';

export function createHttpSource({ baseUrl, fetch }) {
  return {
    async listRecords() {
      // TODO: GET /v1/records
      return [];
    },
    async createRecord(input) {
      // TODO: POST /v1/records
      return null;
    },
    async updateRecord(id, changes) {
      // TODO: PATCH /v1/records/:id
      return null;
    },
  };
}
