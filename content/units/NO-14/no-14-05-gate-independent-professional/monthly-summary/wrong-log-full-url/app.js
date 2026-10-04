// @ts-check
// The monthly summary feature on node:http: an API route and a server-rendered page.
// See the task for every rule. createApp({ db, log }) returns an http.Server.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { monthSummary } from './summary.js';
import { MonthSummary } from './MonthSummary.js';
import { createElement as h, renderToString } from './mini-react.js';

const MONTH = /^(20\d\d)-(0[1-9]|1[0-2])$/;
const REQUEST_ID = /^[\w-]{1,64}$/;

// The contract of GET /api/summary: month YYYY-MM (2000-01 … 2099-12), top 1–10, nothing else.
/**
 * @typedef {{ requestId: string, method: string, path: string, status: number }} LogEntry
 * @param {URLSearchParams} params
 * @returns {{ errors: Record<string, string> } | { errors?: undefined, month: string, top: number }}
 */
function parseQuery(params) {
  /** @type {Record<string, string>} */
  const errors = {};
  for (const key of params.keys()) if (key !== 'month' && key !== 'top') errors[key] = 'unknown-parameter';
  const month = params.get('month') ?? '';
  if (!MONTH.test(month)) errors.month = 'invalid-month';
  const topText = params.get('top') ?? '5';
  const top = Number(topText);
  if (!/^\d+$/.test(topText) || top < 1 || top > 10) errors.top = 'out-of-range';
  return Object.keys(errors).length > 0 ? { errors } : { month, top };
}

// JSON that cannot close its <script> and keeps the same data after JSON.parse.
/** @param {unknown} value */
const safeJson = (value) => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
/** @type {Record<string, string>} */
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
/** @param {string} text */
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

/** @param {import('./summary.js').MonthSummaryResult} summary */
function page(summary) {
  return '<!doctype html><html lang="%%lang%%"><head><meta charset="utf-8"><title>%%pageTitle%%</title></head><body>'
    + `<div id="root">${renderToString(h(MonthSummary, { summary }))}</div>`
    + `<script id="initial-data" type="application/json">${safeJson({ summary })}</script>`
    + '</body></html>';
}

/**
 * @param {{ db: import('node:sqlite').DatabaseSync, log?: (entry: LogEntry) => void }} options
 * @returns {http.Server}
 */
export function createApp({ db, log = () => {} }) {
  return http.createServer({ requestTimeout: 5000, headersTimeout: 5000 }, (request, response) => {
    const header = request.headers['x-request-id'];
    const requestId = typeof header === 'string' && REQUEST_ID.test(header) ? header : randomUUID();
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    /** @param {number} status @param {string} type @param {string} body */
    const send = (status, type, body) => {
      response.writeHead(status, { 'content-type': `${type}; charset=utf-8`, 'x-request-id': requestId });
      response.end(body);
      log({ requestId, method: request.method ?? '', path: request.url ?? '', status });
    };
    /** @param {number} status @param {unknown} value */
    const json = (status, value) => send(status, 'application/json', JSON.stringify(value));
    try {
      if (request.method === 'GET' && url.pathname === '/api/summary') {
        const query = parseQuery(url.searchParams);
        if (query.errors) return json(400, { error: { code: 'VALIDATION_FAILED', details: query.errors } });
        return json(200, monthSummary(db, query.month, query.top));
      }
      const pageMatch = /^\/summary\/([^/]+)$/.exec(url.pathname);
      if (request.method === 'GET' && pageMatch) {
        if (!MONTH.test(pageMatch[1])) return send(400, 'text/html', '<!doctype html><meta charset="utf-8"><p>%%badMonth%%</p>');
        return send(200, 'text/html', page(monthSummary(db, pageMatch[1])));
      }
      json(404, { error: { code: 'NOT_FOUND' } });
    } catch {
      send(500, 'text/html', `<!doctype html><meta charset="utf-8"><h1>%%errorTitle%%</h1><p>%%errorText%% <code>${escapeHtml(requestId)}</code></p>`);
    }
  });
}
