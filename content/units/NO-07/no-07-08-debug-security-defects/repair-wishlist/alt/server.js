// Another valid repair: a containment check on the resolved path instead of a name allowlist.
//   GET  /items[?filter[category]=…]   the list, optionally filtered
//   POST /items                        create a wish (413 over 16 KB, 400 for a body that is not JSON)
//   GET  /items/<id>/price-per-month   a calculation (it has an ordinary bug for an unknown id)
//   GET  /snapshots/<name>             a saved copy of the list from data/snapshots/
import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

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
    const url = new URL(request.url, 'http://localhost');
    const pathname = url.pathname;
    if (request.method === 'GET' && pathname === '/items') {
      // URLSearchParams keeps "filter[category]" as a plain name and never touches Object.prototype.
      const category = url.searchParams.get('filter[category]');
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
      // Resolve the final path and require it to stay inside the snapshots folder (as resolveInside in NO-02).
      let name;
      try {
        name = decodeURIComponent(snapshot[1]);
      } catch {
        return sendJson(response, 400, { error: { code: 'BAD_NAME' } }); // a malformed %-escape
      }
      const target = path.resolve(SNAPSHOTS_DIR, name);
      const relative = path.relative(SNAPSHOTS_DIR, target);
      if (relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return sendJson(response, 400, { error: { code: 'BAD_NAME' } });
      const text = await readFile(target, 'utf8').catch(() => null);
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
