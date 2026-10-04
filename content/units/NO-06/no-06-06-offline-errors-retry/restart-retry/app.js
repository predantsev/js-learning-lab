// The expenses API. `store` stands in for the server's file or database: it outlives a restart.
// Fault for the lesson: the FIRST POST is stored, but its answer is lost (the connection is dropped).
import http from 'node:http';

export function createStore() {
  return { expenses: [{ id: 'e-01', label: '%%groceries%%', amountMinor: 84550, category: 'food' }], answered: new Map(), dropNextPost: true };
}

export function createApp(store) {
  const send = (response, status, value) => {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
  };
  return http.createServer(async (request, response) => {
    console.log(`  [server] ${request.method} ${request.url}`);
    if (request.url !== '/v1/records') return send(response, 404, { error: { code: 'NOT_FOUND' } });
    if (request.method === 'GET') return send(response, 200, store.expenses);
    let text = '';
    for await (const chunk of request) text += chunk;
    const key = request.headers['idempotency-key'];
    if (key && store.answered.has(key)) return send(response, 201, store.answered.get(key)); // a retry: answer again, store nothing
    const expense = { id: `e-${String(store.expenses.length + 1).padStart(2, '0')}`, ...JSON.parse(text) };
    store.expenses.push(expense);
    if (key) store.answered.set(key, expense);
    if (store.dropNextPost) {
      store.dropNextPost = false;
      return request.socket.destroy(); // the work is done, the answer is lost
    }
    send(response, 201, expense);
  });
}
