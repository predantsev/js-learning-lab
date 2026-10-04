// The expenses API with the data the server holds today (one more expense than the fixtures).
import http from 'node:http';

export function createApp() {
  const expenses = [
    { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
    { id: 'e-02', label: '%%pass%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' },
    { id: 'e-03', label: '%%coffee%%', amountMinor: 18000, date: '2026-02-28', category: 'fun' },
    { id: 'e-04', label: '%%bulbs%%', amountMinor: 9990, date: '2026-02-27', category: 'home' },
    { id: 'e-06', label: '%%lunch%%', amountMinor: 21050, date: '2026-03-02', category: 'food' },
  ];
  return http.createServer((request, response) => {
    const found = request.method === 'GET' && request.url === '/v1/records';
    console.log(`[server] ${request.method} ${request.url} → ${found ? 200 : 404}`);
    response.writeHead(found ? 200 : 404, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(found ? expenses : { error: { code: 'NOT_FOUND' } }));
  });
}
