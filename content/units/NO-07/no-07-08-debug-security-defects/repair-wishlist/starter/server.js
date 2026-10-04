// A wishlist API that passes its happy-path tests — and hides four security defects. Repair them.
//   GET  /items[?filter[category]=…]   the list, optionally filtered
//   POST /items                        create a wish (413 over 16 KB, 400 for a body that is not JSON)
//   GET  /items/<id>/price-per-month   a calculation (it has an ordinary bug for an unknown id)
//   GET  /snapshots/<name>             a saved copy of the list from data/snapshots/
import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { parse } from './vendor/tiny-query.js';

const SNAPSHOTS_DIR = path.resolve('data/snapshots');

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(value));
}

const MAX_BODY_BYTES = 16 * 1024;

// Reads a JSON body, counting bytes as they arrive (lesson no-07-02). Resolves null past the limit
// and undefined for text that is not JSON, so the route can answer 413 or 400.
function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const onData = (chunk) => {
      size += chunk.length;
      if (size <= MAX_BODY_BYTES) return chunks.push(chunk);
      request.off('data', onData);
      request.pause(); // read nothing more
      resolve(null);
    };
    request.on('data', onData);
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        resolve(undefined);
      }
    });
    request.on('error', reject);
  });
}

export function createServer({ log }) {
  const items = [
    { id: 'w-01', name: '%%headphones%%', price: 80, category: 'tech' },
    { id: 'w-02', name: '%%lamp%%', price: 45, category: 'home' },
  ];

  async function handle(request, response) {
    const [pathname, search = ''] = request.url.split('?');
    if (request.method === 'GET' && pathname === '/items') {
      const query = parse(search);
      const category = query.filter?.category;
      return sendJson(response, 200, category ? items.filter((item) => item.category === category) : items);
    }
    if (request.method === 'POST' && pathname === '/items') {
      const body = await readBody(request);
      if (body === null) return sendJson(response, 413, { error: { code: 'PAYLOAD_TOO_LARGE' } }, { connection: 'close' });
      if (body === undefined || typeof body !== 'object') return sendJson(response, 400, { error: { code: 'MALFORMED_JSON' } });
      const item = { id: `w-${String(items.length + 1).padStart(2, '0')}`, ...body };
      items.push(item);
      return sendJson(response, 201, item);
    }
    const price = /^\/items\/([^/]+)\/price-per-month$/.exec(pathname);
    if (request.method === 'GET' && price) {
      const item = items.find((candidate) => candidate.id === price[1]);
      return sendJson(response, 200, { perMonth: Math.ceil(item.price / 12) }); // throws for an unknown id
    }
    const snapshot = /^\/snapshots\/([^/]+)$/.exec(pathname);
    if (request.method === 'GET' && snapshot) {
      const name = decodeURIComponent(snapshot[1]).replaceAll('../', '');
      return sendJson(response, 200, JSON.parse(await readFile(path.join(SNAPSHOTS_DIR, name), 'utf8')));
    }
    sendJson(response, 404, { error: { code: 'NOT_FOUND' } });
  }

  return http.createServer((request, response) => {
    log(`[req] ${request.method} ${request.url} ${JSON.stringify(request.headers)}`);
    handle(request, response).catch((error) => {
      sendJson(response, 500, { error: { code: 'INTERNAL', message: error.message, stack: error.stack } });
    });
  });
}
