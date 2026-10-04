// The expense lab's API: GET /expenses, GET /expenses/:id, POST /expenses and GET /metrics.
// Every request gets a request id (the client's x-request-id when it is well formed, otherwise a
// new one), sent back in the x-request-id header and written into one JSON log line.
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { CATEGORIES } from './expenses.js';

const send = (response, status, value) => {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(value));
};

// → { field: problem } for every rule the body breaks (empty when it is a valid new expense).
function validate(body) {
  const errors = {};
  if (typeof body?.label !== 'string' || body.label.trim() === '' || body.label.trim().length > 80) errors.label = 'invalid';
  if (!Number.isInteger(body?.amountMinor)) errors.amountMinor = 'notInteger';
  else if (body.amountMinor <= 0) errors.amountMinor = 'notPositive';
  if (typeof body?.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) errors.date = 'invalid';
  if (!CATEGORIES.includes(body?.category)) errors.category = 'unknown';
  return errors;
}

export function createApp(repo, log = () => {}) {
  const metrics = {};
  return http.createServer(async (request, response) => {
    const started = performance.now();
    const readsBefore = repo.stats.reads;
    const incoming = request.headers['x-request-id'];
    const requestId = typeof incoming === 'string' && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID().slice(0, 8);
    response.setHeader('x-request-id', requestId);
    const url = new URL(request.url, 'http://lab.local');
    const route = url.pathname.startsWith('/expenses/') ? '/expenses/:id' : url.pathname;
    const line = { requestId, method: request.method, route };
    response.on('finish', () => {
      const ms = Math.round(performance.now() - started);
      log(JSON.stringify({ time: new Date().toISOString(), ...line, status: response.statusCode, ms, reads: repo.stats.reads - readsBefore }));
      const key = `${request.method} ${route}`;
      const entry = (metrics[key] ??= { count: 0, maxMs: 0, statuses: {} });
      entry.count += 1;
      entry.maxMs = Math.max(entry.maxMs, ms);
      entry.statuses[response.statusCode] = (entry.statuses[response.statusCode] ?? 0) + 1;
    });
    try {
      if (route === '/metrics' && request.method === 'GET') return send(response, 200, metrics);
      if (route === '/expenses' && request.method === 'GET') return send(response, 200, await repo.list());
      if (route === '/expenses/:id' && request.method === 'GET') {
        const expense = await repo.get(decodeURIComponent(url.pathname.slice('/expenses/'.length)));
        return expense ? send(response, 200, expense) : send(response, 404, { error: { code: 'NOT_FOUND' } });
      }
      if (route === '/expenses' && request.method === 'POST') {
        let text = '';
        for await (const chunk of request) text += chunk;
        let body;
        try {
          body = JSON.parse(text);
        } catch {
          line.error = 'malformed JSON';
          return send(response, 400, { error: { code: 'MALFORMED_JSON' } });
        }
        const errors = validate(body);
        if (Object.keys(errors).length > 0) {
          line.error = errors;
          return send(response, 400, { error: { code: 'VALIDATION_FAILED', fields: errors } });
        }
        const expense = { id: `e-${randomUUID().slice(0, 8)}`, label: body.label.trim(), amountMinor: body.amountMinor, date: body.date, category: body.category };
        return send(response, 201, await repo.add(expense));
      }
      send(response, 404, { error: { code: 'NOT_FOUND' } });
    } catch (error) {
      line.error = error.message;
      send(response, 500, { error: { code: 'INTERNAL' } });
    }
  });
}
