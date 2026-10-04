// The expense service: GET /expenses?category=… and GET /metrics.
// Every request gets an id; every step and the request itself are logged with that id.
import http from 'node:http';
import { categories } from './expenses.js';
import { span } from './trace.js';

export function createService({ repository, metrics, log }) {
  let lastId = 0;
  return http.createServer(async (request, response) => {
    const requestId = `r-${String(++lastId).padStart(4, '0')}`;
    const started = performance.now();
    const url = span('parse', requestId, log, () => new URL(request.url, 'http://127.0.0.1'));
    let status = 200;
    let type = 'application/json';
    let body;

    if (url.pathname === '/metrics') {
      type = 'text/plain; charset=utf-8';
      body = metrics.text();
    } else if (url.pathname === '/expenses') {
      const category = span('validate', requestId, log, () => url.searchParams.get('category'));
      if (!categories.includes(category)) {
        status = 400;
        body = JSON.stringify({ error: 'unknown category' });
      } else {
        const found = await repository.list(category);
        body = span('serialize', requestId, log, () => JSON.stringify(found.slice(0, 20)));
      }
    } else {
      status = 404;
      body = JSON.stringify({ error: 'not found' });
    }

    response.writeHead(status, { 'content-type': type, 'x-request-id': requestId });
    response.end(body);
    const ms = performance.now() - started;
    metrics.record(url.pathname, status, ms);
    log({ requestId, route: url.pathname, status, ms: Math.round(ms * 100) / 100 });
  });
}
