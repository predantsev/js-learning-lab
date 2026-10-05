// An in-memory wishlist API. The URL names WHAT (the records collection or one record),
// the method says WHAT TO DO with it. Input is not validated yet: that comes in the next lesson.
import http from 'node:http';
import { readJsonBody, sendEmpty, sendJson } from './http-helpers.js';
import { seedRecords } from './records.js';

export function createApp() {
  // A fresh copy for every app: two apps never share their records.
  const records = seedRecords.map((record) => ({ ...record }));
  let nextNumber = 6;

  async function handle(request, response) {
    const url = new URL(request.url, 'http://localhost');
    // "/records/w-02" → ["records", "w-02"]
    const parts = url.pathname.split('/').filter((part) => part !== '');

    // The collection: /records
    if (parts.length === 1 && parts[0] === 'records') {
      if (request.method === 'GET') return sendJson(response, 200, records);
      if (request.method === 'POST') {
        const body = await readJsonBody(request);
        const record = { id: `w-${String(nextNumber++).padStart(2, '0')}`, price: null, acquired: false, category: null, ...body };
        records.push(record);
        return sendJson(response, 201, record);
      }
      response.setHeader('allow', 'GET, POST');
      return sendJson(response, 405, { error: 'method not allowed' });
    }

    // One record: /records/:id
    if (parts.length === 2 && parts[0] === 'records') {
      const index = records.findIndex((record) => record.id === parts[1]);
      if (!['GET', 'PUT', 'PATCH'].includes(request.method)) {
        response.setHeader('allow', 'GET, PUT, PATCH');
        return sendJson(response, 405, { error: 'method not allowed' });
      }
      if (index === -1) return sendJson(response, 404, { error: 'not found' });
      if (request.method === 'GET') return sendJson(response, 200, records[index]);
      const body = await readJsonBody(request);
      if (request.method === 'PUT') {
        // Replace: the body IS the new record; fields it does not send are gone.
        records[index] = { ...body, id: parts[1] };
      } else {
        // Partial update: only the fields in the body change.
        records[index] = { ...records[index], ...body, id: parts[1] };
      }
      return sendJson(response, 200, records[index]);
    }

    // A verb-style route: the action hides in the address, the id in the query string.
    if (url.pathname === '/deleteRecord' && request.method === 'POST') {
      const index = records.findIndex((record) => record.id === url.searchParams.get('id'));
      if (index === -1) return sendJson(response, 404, { error: 'not found' });
      records.splice(index, 1);
      return sendJson(response, 200, { deleted: true });
    }

    return sendJson(response, 404, { error: 'not found' });
  }

  return http.createServer((request, response) => {
    handle(request, response).catch((error) => sendJson(response, error.status ?? 500, { error: error.message }));
  });
}
