// Read-only: a habit server whose POST /records uses your readJsonBody.
import http from 'node:http';
import { readJsonBody } from './body.js';

function sendJson(res, status, value) {
  const text = JSON.stringify(value);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text) });
  res.end(text);
}

export function createApp({ maxBytes }) {
  return http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      if (pathname !== '/records') return sendJson(res, 404, { error: 'not found' });
      if (req.method !== 'POST') {
        res.setHeader('allow', 'POST');
        return sendJson(res, 405, { error: 'method not allowed' });
      }
      const value = await readJsonBody(req, maxBytes);
      sendJson(res, 201, { received: value });
    } catch (error) {
      if (res.headersSent || res.destroyed) return res.end();
      if (error.status === 413) res.setHeader('connection', 'close');
      if (typeof error.status === 'number') return sendJson(res, error.status, { error: error.message });
      console.error(`${error.name}: ${error.message}`);
      sendJson(res, 500, { error: 'internal error' });
    }
  });
}
