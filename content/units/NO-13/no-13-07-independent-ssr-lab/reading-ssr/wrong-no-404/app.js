// The reading-list SSR route.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { createElement as h, renderToString } from './mini-react.js';
import { clientElement } from './client.js';
import { config } from './config.js';

const ESCAPES = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' };
const toHtmlJson = (value) => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => ESCAPES[char]);
// The request id comes from a request header: untrusted text, so it is escaped for HTML.
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

const publicBook = ({ id, title, author, status }) => ({ id, title, author, status });

function document(title, body) {
  return `<!doctype html><html lang="${config.lang}"><head><meta charset="utf-8"><title>${title}</title></head><body>${body}</body></html>`;
}

export function createApp({ loadBooks, log }) {
  return http.createServer((req, res) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    let html;
    try {
      const data = { books: loadBooks().map(publicBook), filter: 'all' };
      const markup = renderToString(clientElement(data));
      html = document('%%pageTitle%%', `<div id="root">${markup}</div>`
        + `<script id="initial-data" type="application/json">${toHtmlJson(data)}</script>`
        + '<script type="module" src="/client.js"></script>');
    } catch (error) {
      log({ level: 'error', requestId, message: error.message });
      res.writeHead(500, { 'content-type': 'text/html; charset=utf-8', 'x-request-id': requestId });
      res.end(document('%%errorTitle%%', `<h1>%%errorTitle%%</h1><p>%%errorText%% <code>${escapeHtml(requestId)}</code></p>`));
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-request-id': requestId });
    res.end(html);
  });
}
