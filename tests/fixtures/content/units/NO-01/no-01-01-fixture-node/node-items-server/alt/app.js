// Another valid solution: the path from a URL object, status and header set as properties.
import http from 'node:http';
import { items } from './items.js';

export function createApp() {
  return http.createServer((request, response) => {
    const { pathname } = new URL(request.url, 'http://localhost');
    response.setHeader('content-type', 'application/json; charset=utf-8');
    if (pathname === '/items') {
      response.statusCode = 200;
      response.end(JSON.stringify(items));
    } else {
      response.statusCode = 404;
      response.end(JSON.stringify({ error: 'not found' }));
    }
  });
}
