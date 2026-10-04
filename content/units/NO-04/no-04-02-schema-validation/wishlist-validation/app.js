// The wishlist API with validation at the edge: POST /records stores only what the schema let through.
import http from 'node:http';
import { readJsonBody, sendJson } from './http-helpers.js';
import { validateWishInput } from './validate.js';

export function createApp() {
  const records = []; // a fresh, empty store for every app
  let nextNumber = 1;

  async function handle(request, response) {
    const { pathname } = new URL(request.url, 'http://localhost');
    if (pathname === '/records' && request.method === 'GET') return sendJson(response, 200, records);
    if (pathname === '/records' && request.method === 'POST') {
      const result = validateWishInput(await readJsonBody(request));
      if (!result.ok) return sendJson(response, 400, { errors: result.errors });
      // From here on only the parsed value is used, never the raw body.
      const record = { id: `w-${String(nextNumber++).padStart(2, '0')}`, ...result.value };
      records.push(record);
      return sendJson(response, 201, record);
    }
    return sendJson(response, 404, { error: 'not found' });
  }

  return http.createServer((request, response) => {
    handle(request, response).catch((error) => sendJson(response, error.status ?? 500, { error: error.message }));
  });
}
