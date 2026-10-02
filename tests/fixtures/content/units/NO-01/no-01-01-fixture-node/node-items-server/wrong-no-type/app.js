// Misconception: JSON text is enough; the answer does not say it is JSON (no content-type).
import http from 'node:http';
import { items } from './items.js';

export function createApp() {
  return http.createServer((request, response) => {
    if (request.url === '/items') {
      response.end(JSON.stringify(items));
      return;
    }
    response.statusCode = 404;
    response.end();
  });
}
