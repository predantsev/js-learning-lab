// The expenses API (read-only: you edit list.js). GET /expenses passes its query string to listRecords.
import http from 'node:http';
import { readJsonBody, sendJson } from './http-helpers.js';
import { seedExpenses } from './expenses.js';
import { listRecords } from './list.js';

export function createApp() {
  const expenses = seedExpenses.map((expense) => ({ ...expense })); // a fresh copy for every app

  async function handle(request, response) {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname !== '/expenses') return sendJson(response, 404, { error: { code: 'NOT_FOUND' } });
    if (request.method === 'POST') {
      const expense = await readJsonBody(request);
      expenses.push(expense);
      return sendJson(response, 201, expense);
    }
    // "?category=food&limit=3" → { category: 'food', limit: '3' }
    const result = listRecords(expenses, Object.fromEntries(url.searchParams));
    if (!result.ok) return sendJson(response, 400, { error: { code: 'VALIDATION_FAILED', details: result.errors } });
    return sendJson(response, 200, { items: result.items, nextCursor: result.nextCursor });
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => sendJson(response, 500, { error: { code: 'INTERNAL' } }));
  });
}
