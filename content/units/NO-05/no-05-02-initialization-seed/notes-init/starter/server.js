// The notes server: GET /notes answers the records of the store file; anything else answers 404.
import http from 'node:http';
import { readStore } from './disk.js';

export function createApp(file) {
  return http.createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/notes') {
      try {
        const store = await readStore(file);
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify(store.records));
      } catch (error) {
        response.writeHead(500, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ error: error.code ?? error.name }));
      }
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'not found' }));
  });
}
