// Misconception: the vulnerable parser is fine, because the happy-path tests are green.
//   GET  /items[?filter[category]=…]   the list, optionally filtered
//   POST /items                        create a wish
//   GET  /items/<id>/price-per-month   a calculation (it has an ordinary bug for an unknown id)
//   GET  /snapshots/<name>             a saved copy of the list from data/snapshots/
import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { parse } from './vendor/tiny-query.js';

const SNAPSHOTS_DIR = path.resolve('data/snapshots');

function sendJson(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

async function readBody(request) {
  let text = '';
  for await (const chunk of request) text += chunk;
  return JSON.parse(text);
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
      const item = { id: `w-${String(items.length + 1).padStart(2, '0')}`, ...(await readBody(request)) };
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
      const name = decodeURIComponent(snapshot[1]);
      // An allowlist of snapshot names: a date and .json. Nothing else can reach the file system.
      if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(name)) return sendJson(response, 400, { error: { code: 'BAD_NAME' } });
      const text = await readFile(path.join(SNAPSHOTS_DIR, name), 'utf8').catch(() => null);
      if (text === null) return sendJson(response, 404, { error: { code: 'NOT_FOUND' } });
      return sendJson(response, 200, JSON.parse(text));
    }
    sendJson(response, 404, { error: { code: 'NOT_FOUND' } });
  }

  return http.createServer((request, response) => {
    log(`[req] ${request.method} ${new URL(request.url, 'http://localhost').pathname}`); // no headers, no query
    handle(request, response).catch((error) => {
      log(`[error] ${request.method} ${request.url.split('?')[0]} ${error.name}`); // the details stay on the server
      sendJson(response, 500, { error: { code: 'INTERNAL' } });
    });
  });
}
