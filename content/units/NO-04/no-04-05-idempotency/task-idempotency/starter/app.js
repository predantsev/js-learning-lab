// The planner API (read-only: you edit idempotency.js). POST /tasks goes through the idempotency store.
import http from 'node:http';
import { createIdempotencyStore } from './idempotency.js';

export function createApp() {
  // A fresh store and a fresh idempotency store for every app.
  const tasks = [
    { id: 't-01', title: '%%water%%', dueDate: '2026-03-02', done: false, priority: 'normal' },
    { id: 't-02', title: '%%books%%', dueDate: '2026-03-01', done: false, priority: 'high' },
  ];
  const idempotency = createIdempotencyStore();
  let nextNumber = 3;

  const send = (response, status, value) => {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
  };

  async function handle(request, response) {
    if (request.url !== '/tasks') return send(response, 404, { error: { code: 'NOT_FOUND' } });
    if (request.method === 'GET') return send(response, 200, tasks);
    if (request.method !== 'POST') return send(response, 405, { error: { code: 'METHOD_NOT_ALLOWED' } });

    let rawBody = '';
    for await (const chunk of request) rawBody += chunk;
    const key = request.headers['idempotency-key']; // undefined when the client sent none

    const { status, body } = await idempotency.run(key, rawBody, async () => {
      // The real work: runs at most once per key.
      const input = JSON.parse(rawBody);
      const task = { id: `t-${String(nextNumber++).padStart(2, '0')}`, dueDate: null, done: false, priority: 'normal', ...input };
      tasks.push(task);
      return { status: 201, body: task };
    });
    return send(response, status, body);
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => send(response, 500, { error: { code: 'INTERNAL' } }));
  });
}
