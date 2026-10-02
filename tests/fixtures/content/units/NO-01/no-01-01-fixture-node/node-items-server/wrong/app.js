// Misconception: the server answers every address the same way, so /missing gets the list too.
import http from 'node:http';
import { items } from './items.js';

export function createApp() {
  return http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(items));
  });
}
