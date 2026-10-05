// The reading-list SSR route.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createElement as h, renderToString } from './mini-react.js';
import { clientElement } from './client.js';
import { config } from './config.js';

const PUBLIC = ['id', 'title', 'author', 'status'];

function safeJson(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function pageFor(books) {
  const data = { books: books.map((book) => Object.fromEntries(PUBLIC.map((key) => [key, book[key]]))), filter: 'all' };
  return [
    '<!DOCTYPE html>',
    `<html lang="${config.lang}">`,
    '<head><meta charset="UTF-8"><title>%%pageTitle%%</title></head>',
    `<body><div id="root">${renderToString(clientElement(data))}</div>`,
    `<script id="initial-data" type="application/json">${safeJson(data)}</script>`,
    '<script src="/client.js" type="module"></script></body>',
    '</html>',
  ].join('\n');
}

function send(res, status, type, requestId, body) {
  res.statusCode = status;
  res.setHeader('content-type', `${type}; charset=utf-8`);
  res.setHeader('x-request-id', requestId);
  res.end(body);
}

export function createApp({ loadBooks, log }) {
  return http.createServer((req, res) => {
    // Keep an incoming id only when it looks like one: it is untrusted text.
    const incoming = req.headers['x-request-id'];
    const requestId = /^[A-Za-z0-9._-]{1,64}$/.test(incoming ?? '') ? incoming : randomUUID();
    if (req.method !== 'GET' || req.url !== '/') return send(res, 404, 'text/plain', requestId, 'not found');
    try {
      send(res, 200, 'text/html', requestId, pageFor(loadBooks()));
    } catch (error) {
      log({ level: 'error', requestId, message: String(error.message) });
      send(res, 500, 'text/html', requestId, `<!DOCTYPE html><html lang="${config.lang}"><head><meta charset="UTF-8"><title>%%errorTitle%%</title></head><body><h1>%%errorTitle%%</h1><p>%%errorText%% <code>${requestId}</code></p></body></html>`);
    }
  });
}
