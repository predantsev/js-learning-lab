// The items API: GET /items answers with the items as JSON; any other address answers 404.
import http from 'node:http';
import { items } from './items.js';

export function createApp() {
  return http.createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/items') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(items));
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'not found' }));
  });
}
