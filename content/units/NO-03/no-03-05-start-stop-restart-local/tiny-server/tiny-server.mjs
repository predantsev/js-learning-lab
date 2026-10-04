// A tiny wishlist server for your own terminal. It has no dependencies.
// Start: node tiny-server.mjs          (port 7320 on 127.0.0.1)
// Another port: PORT=7321 node tiny-server.mjs
// Stop: Ctrl+C
//
// GET /health         → { "ok": true }
// GET /records        → every wish
// GET /records/<id>   → one wish, or 404
// another method      → 405 with an Allow header; another address → 404
import http from 'node:http';
import { pathToFileURL } from 'node:url';

const wishes = [
  { id: 'w-01', name: '%%wish1%%', price: 80, acquired: false },
  { id: 'w-02', name: '%%wish2%%', price: 45, acquired: false },
  { id: 'w-04', name: '%%wish4%%', price: 25, acquired: true },
];

function sendJson(res, status, value) {
  const text = JSON.stringify(value);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text) });
  res.end(text);
}

export function createTinyServer({ log = console.log } = {}) {
  return http.createServer((req, res) => {
    res.on('finish', () => log(`${req.method} ${req.url} → ${res.statusCode}`));
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      const known = pathname === '/health' || pathname === '/records' || /^\/records\/[^/]+$/.test(pathname);
      if (!known) return sendJson(res, 404, { error: 'not found' });
      if (req.method !== 'GET') {
        res.setHeader('allow', 'GET');
        return sendJson(res, 405, { error: 'method not allowed' });
      }
      if (pathname === '/health') return sendJson(res, 200, { ok: true });
      if (pathname === '/records') return sendJson(res, 200, wishes);
      const id = decodeURIComponent(pathname.slice('/records/'.length));
      const wish = wishes.find((w) => w.id === id);
      if (!wish) return sendJson(res, 404, { error: 'not found', id });
      sendJson(res, 200, wish);
    } catch (error) {
      log(`${error.name}: ${error.message}`);
      if (!res.headersSent) sendJson(res, 500, { error: 'internal error' });
    }
  });
}

// Runs only when this file is started with `node tiny-server.mjs`, not when another module imports it.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 7320);
  const server = createTinyServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`Tiny server listening on http://127.0.0.1:${port}`);
    console.log('Stop it with Ctrl+C.');
  });
  process.on('SIGINT', () => {
    console.log('SIGINT received: closing the server…');
    server.close(() => console.log('Server closed. Bye.'));
  });
}
