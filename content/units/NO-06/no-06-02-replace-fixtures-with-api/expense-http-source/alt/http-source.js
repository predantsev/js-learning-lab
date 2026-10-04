// The HTTP data source of the expense client, written method by method without a shared helper.
import { parseExpense } from './contract.js';

const JSON_HEADERS = { 'content-type': 'application/json' };

async function bodyOf(response) {
  if (!response.ok) {
    const error = new Error(`the server answered ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function toExpense(value) {
  const parsed = parseExpense(value);
  if (parsed.ok) return parsed.value;
  throw new TypeError('the server sent an expense that breaks the contract');
}

export function createHttpSource({ baseUrl, fetch }) {
  return {
    async listRecords() {
      const list = await bodyOf(await fetch(`${baseUrl}/v1/records`));
      if (!Array.isArray(list)) throw new TypeError('expected a list of expenses');
      const expenses = [];
      for (const item of list) expenses.push(toExpense(item));
      return expenses;
    },
    async createRecord(input) {
      const response = await fetch(`${baseUrl}/v1/records`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(input) });
      return toExpense(await bodyOf(response));
    },
    async updateRecord(id, changes) {
      const response = await fetch(`${baseUrl}/v1/records/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(changes),
      });
      return toExpense(await bodyOf(response));
    },
  };
}
