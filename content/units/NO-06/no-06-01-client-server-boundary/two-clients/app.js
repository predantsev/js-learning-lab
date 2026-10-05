// A small wishlist API: GET /v1/records and PATCH /v1/records/:id. Every createApp() has its own data.
import http from 'node:http';

export function createApp() {
  const records = [
    { id: 'w-01', name: '%%headphones%%', price: 80, acquired: false },
    { id: 'w-02', name: '%%lamp%%', price: 45, acquired: false },
    { id: 'w-03', name: '%%bicycle%%', price: 240, acquired: false },
    { id: 'w-04', name: '%%book%%', price: 25, acquired: true },
  ];

  const send = (response, status, value) => {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
  };

  async function handle(request, response) {
    const [version, collection, id] = request.url.split('/').filter((part) => part !== '');
    if (version !== 'v1' || collection !== 'records') return send(response, 404, { error: { code: 'NOT_FOUND' } });
    if (id === undefined && request.method === 'GET') return send(response, 200, records);

    const record = records.find((item) => item.id === id);
    if (!record || request.method !== 'PATCH') return send(response, 404, { error: { code: 'NOT_FOUND' } });
    let text = '';
    for await (const chunk of request) text += chunk;
    const changes = JSON.parse(text);
    // The server decides what is valid: a price is a whole number, 0 or more.
    if ('price' in changes && !(Number.isInteger(changes.price) && changes.price >= 0)) {
      return send(response, 400, { error: { code: 'VALIDATION_FAILED', details: { price: 'errors.price' } } });
    }
    Object.assign(record, changes);
    send(response, 200, record);
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => send(response, 400, { error: { code: 'MALFORMED_JSON' } }));
  });
}
