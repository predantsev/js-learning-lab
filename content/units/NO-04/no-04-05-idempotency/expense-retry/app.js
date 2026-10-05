// An expenses API with a fault injector: it stores the FIRST expense and then drops the connection
// instead of answering, as if the response got lost on the way back.
import http from 'node:http';

export function createApp() {
  const expenses = []; // a fresh, empty store for every app
  const answered = new Map(); // Idempotency-Key → the answer already sent for it
  let dropNext = true;

  async function handle(request, response) {
    if (request.url !== '/expenses' || request.method !== 'POST') {
      response.writeHead(200, { 'content-type': 'application/json' });
      return response.end(JSON.stringify(expenses));
    }
    let text = '';
    for await (const chunk of request) text += chunk;
    const key = request.headers['idempotency-key'];

    // A key seen before: answer exactly as the first time, and create nothing.
    // (A real store also checks that the body is the same — that is your task in this lesson.)
    if (key && answered.has(key)) {
      const first = answered.get(key);
      console.log(`[server] ${key.slice(0, 8)}… %%replayed%%`);
      response.writeHead(first.status, { 'content-type': 'application/json' });
      return response.end(first.text);
    }

    const expense = { id: `e-${expenses.length + 1}`, ...JSON.parse(text) };
    expenses.push(expense);
    console.log(`[server] %%stored%% ${expense.id}`);
    const answer = { status: 201, text: JSON.stringify(expense) };
    if (key) answered.set(key, answer);

    if (dropNext) {
      dropNext = false;
      console.log('[server] %%dropped%%');
      return request.socket.destroy(); // the fault: the work is done, the answer is lost
    }
    response.writeHead(answer.status, { 'content-type': 'application/json' });
    response.end(answer.text);
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => response.destroy());
  });
}
