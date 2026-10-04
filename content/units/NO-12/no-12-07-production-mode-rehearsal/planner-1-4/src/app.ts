// The planner HTTP API: tasks, health checks and metrics.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { byPriority, type Task } from './tasks.ts';
import type { Store } from './store.ts';
import { createMetrics } from './metrics.ts';

export type Health = { shuttingDown: boolean };

export function createApp(store: Store, health: Health = { shuttingDown: false }): http.Server {
  const metrics = createMetrics();

  return http.createServer(async (request, response) => {
    const started = performance.now();
    const route = (request.url ?? '/').split('?')[0];
    const send = (status: number, body: unknown, type = 'application/json') => {
      const headers: Record<string, string> = { 'content-type': type };
      if (health.shuttingDown) headers.connection = 'close';
      response.writeHead(status, headers);
      response.end(type === 'application/json' ? JSON.stringify(body) : String(body));
      metrics.record(route, status, performance.now() - started);
    };
    try {
      if (route === '/livez') return send(200, { status: 'alive' });
      if (route === '/readyz') return health.shuttingDown ? send(503, { status: 'shutting down' }) : send(200, { status: 'ready' });
      if (route === '/metrics') return send(200, metrics.text(), 'text/plain; charset=utf-8');
      if (request.method === 'GET' && route === '/tasks') return send(200, store.list().toSorted(byPriority));
      if (request.method === 'POST' && route === '/tasks') {
        let text = '';
        for await (const chunk of request) text += chunk;
        const input = JSON.parse(text || '{}');
        if (typeof input.title !== 'string' || input.title.trim() === '') return send(400, { error: 'title is required' });
        const task: Task = { id: randomUUID(), title: input.title.trim(), dueDate: input.dueDate ?? null, done: false, priority: input.priority ?? 'normal' };
        await store.add(task);
        return send(201, task);
      }
      return send(404, { error: 'not found' });
    } catch {
      return send(500, { error: 'internal error' });
    }
  });
}
