// The wishlist API used by the React client at http://127.0.0.1:5173.
import http from 'node:http';

export const ALLOWED_ORIGINS = ['http://127.0.0.1:5173'];
const ALLOW_METHODS = 'GET, PATCH';
const ALLOW_HEADERS = 'idempotency-key'; // mistake left in place: content-type is still missing

export function createServer() {
  const wishes = [
    { id: 'w-01', name: '%%headphones%%', price: 80, acquired: false },
    { id: 'w-03', name: '%%bicycle%%', price: 240, acquired: false },
    { id: 'w-07', name: '%%plant%%', price: 30, acquired: false },
  ];
  // Last week: "priceUah is clearer than price".
  const toV1 = (wish) => ({ id: wish.id, name: wish.name, price: wish.price, acquired: wish.acquired });

  const send = (response, status, value) => {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
  };

  return http.createServer(async (request, response) => {
    response.on('finish', () => console.log(`[server] ${request.method} ${request.url} → ${response.statusCode}`));
    const origin = request.headers.origin;
    response.setHeader('vary', 'Origin');
    if (ALLOWED_ORIGINS.includes(origin)) response.setHeader('access-control-allow-origin', origin);
    if (request.method === 'OPTIONS') {
      if (ALLOWED_ORIGINS.includes(origin)) {
        response.setHeader('access-control-allow-methods', ALLOW_METHODS);
        response.setHeader('access-control-allow-headers', ALLOW_HEADERS);
      }
      response.writeHead(204);
      return response.end();
    }
    const [version, collection, id] = request.url.split('/').filter((part) => part !== '');
    if (version !== 'v1' || collection !== 'records') return send(response, 404, { error: { code: 'NOT_FOUND' } });
    if (request.method === 'GET' && id === undefined) return send(response, 200, wishes.map(toV1));
    const wish = wishes.find((item) => item.id === id);
    if (request.method !== 'PATCH' || !wish) return send(response, 404, { error: { code: 'NOT_FOUND' } });
    let text = '';
    for await (const chunk of request) text += chunk;
    const { acquired } = JSON.parse(text);
    if (typeof acquired !== 'boolean') return send(response, 400, { error: { code: 'VALIDATION_FAILED' } });
    wish.acquired = acquired;
    send(response, 200, toV1(wish));
  });
}
