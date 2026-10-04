// A small bookings server over your store.js, started by check.mjs as a separate process.
//   POST /bookings  body: a booking  → 201 with the stored booking, or 409 with { error }
//   GET  /bookings                   → 200 with every booking
// It prints "listening <port>" once initStore has finished and the port is open.
import http from 'node:http';
import { initStore, openRepository } from './store.js';

const file = process.env.BOOKINGS_FILE ?? 'check-data/bookings';
const fixtures = [
  { id: 'k-01', room: 'A', date: '2026-03-02', guests: 2, note: 'fixture' },
  { id: 'k-02', room: 'B', date: '2026-03-02', guests: 4, note: '' },
];

await initStore(file, fixtures);
const repo = await openRepository(file);

const server = http.createServer(async (request, response) => {
  const send = (status, body) => {
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(body));
  };
  try {
    if (request.method === 'GET' && request.url === '/bookings') return send(200, await repo.list());
    if (request.method === 'POST' && request.url === '/bookings') {
      let text = '';
      for await (const chunk of request) text += chunk;
      try {
        return send(201, await repo.add(JSON.parse(text)));
      } catch (error) {
        return send(409, { error: error.message });
      }
    }
    return send(404, { error: 'not found' });
  } catch (error) {
    return send(500, { error: error.message });
  }
});
server.listen(Number(process.env.PORT ?? 0), '127.0.0.1', () => console.log(`listening ${server.address().port}`));
