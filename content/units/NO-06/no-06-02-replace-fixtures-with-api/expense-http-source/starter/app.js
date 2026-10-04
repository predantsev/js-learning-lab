// The expenses API (read-only): GET and POST /v1/records, PATCH /v1/records/:id.
// Writes need Content-Type: application/json. Every createApp() starts with its own data.
import http from 'node:http';

export function createApp() {
  const expenses = [
    { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
    { id: 'e-02', label: '%%pass%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' },
    { id: 'e-03', label: '%%coffee%%', amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  ];
  let next = expenses.length + 1;
  const send = (response, status, value) => {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
  };

  async function handle(request, response) {
    const [version, collection, id, extra] = request.url.split('/').filter((part) => part !== '');
    if (version !== 'v1' || collection !== 'records' || extra !== undefined) return send(response, 404, { error: { code: 'NOT_FOUND' } });
    if (request.method === 'GET' && id === undefined) return send(response, 200, expenses);
    const writes = (request.method === 'POST' && id === undefined) || (request.method === 'PATCH' && id !== undefined);
    if (!writes) return send(response, 405, { error: { code: 'METHOD_NOT_ALLOWED' } });
    if (!String(request.headers['content-type']).startsWith('application/json')) {
      return send(response, 415, { error: { code: 'UNSUPPORTED_MEDIA_TYPE' } });
    }
    let text = '';
    for await (const chunk of request) text += chunk;
    const body = JSON.parse(text);
    if (request.method === 'POST') {
      const expense = { id: `e-${String(next++).padStart(2, '0')}`, ...body };
      expenses.push(expense);
      return send(response, 201, expense);
    }
    const expense = expenses.find((item) => item.id === decodeURIComponent(id));
    if (!expense) return send(response, 404, { error: { code: 'NOT_FOUND' } });
    Object.assign(expense, body);
    send(response, 200, expense);
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => send(response, 400, { error: { code: 'MALFORMED_JSON' } }));
  });
}
