// The items API: GET /items answers with the items as JSON; any other address answers 404.
import http from 'node:http';
import { items } from './items.js';

export function createApp() {
  return http.createServer((request, response) => {
    // Answer GET /items with the items as JSON, and every other address with 404.
    response.end('TODO');
  });
}
