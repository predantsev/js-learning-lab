// The wishlist API's list route (read-only). The edge checks the query before the repository.
import http from 'node:http';
import { parseListQuery } from './query.js';
import { createItemRepo } from './repo.js';

function sendJson(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

export function createApp(repo = createItemRepo()) {
  return http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (request.method !== 'GET' || url.pathname !== '/items') return sendJson(response, 404, { error: { code: 'NOT_FOUND' } });
    const query = parseListQuery(url.searchParams);
    if (!query.ok) return sendJson(response, 400, { error: { code: 'VALIDATION_FAILED', details: query.errors } });
    sendJson(response, 200, { items: repo.list(query.value) });
  });
}
