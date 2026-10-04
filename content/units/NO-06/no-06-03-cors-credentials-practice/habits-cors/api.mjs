// The habits API with hand-written CORS headers for one page origin.
// Started with `node api.mjs` it listens on 127.0.0.1:7330 (PORT and ALLOWED_METHODS can change that).
import http from 'node:http';
import { pathToFileURL } from 'node:url';

export const PAGE_ORIGIN = 'http://127.0.0.1:5173';

export function createHabitsApi({ allowedMethods = 'GET, POST, PATCH' } = {}) {
  const habits = [
    { id: 'h-01', name: '%%exercise%%', frequency: 'daily', active: true, completions: ['2026-02-28', '2026-03-01'] },
    { id: 'h-03', name: '%%water%%', frequency: 'daily', active: true, completions: ['2026-03-01'] },
  ];
  const send = (response, status, value) => {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
  };

  async function handle(request, response) {
    console.log(`[api] ${request.method} ${request.url} — Origin: ${request.headers.origin ?? '-'}`);
    // CORS: the page at PAGE_ORIGIN may read the answers.
    response.setHeader('access-control-allow-origin', PAGE_ORIGIN);
    if (request.method === 'OPTIONS') {
      // A preflight: the browser asks before sending the real request. The handler below never runs for it.
      response.writeHead(204, {
        'access-control-allow-methods': allowedMethods,
        'access-control-allow-headers': 'content-type',
      });
      return response.end();
    }
    const [version, collection, id] = request.url.split('/').filter((part) => part !== '');
    if (version !== 'v1' || collection !== 'records') return send(response, 404, { error: { code: 'NOT_FOUND' } });
    if (request.method === 'GET' && id === undefined) return send(response, 200, habits);
    const habit = habits.find((item) => item.id === id);
    if (request.method !== 'PATCH' || !habit) return send(response, 404, { error: { code: 'NOT_FOUND' } });
    let text = '';
    for await (const chunk of request) text += chunk;
    const { active } = JSON.parse(text);
    if (typeof active !== 'boolean') return send(response, 400, { error: { code: 'VALIDATION_FAILED' } });
    habit.active = active;
    send(response, 200, habit);
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => send(response, 400, { error: { code: 'MALFORMED_JSON' } }));
  });
}

// Runs only when this file is started with `node api.mjs`, not when another module imports it.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 7330);
  const server = createHabitsApi({ allowedMethods: process.env.ALLOWED_METHODS ?? 'GET, POST, PATCH' });
  server.listen(port, '127.0.0.1', () => {
    console.log(`%%apiOn%% http://127.0.0.1:${port}, %%allowedMethods%% ${process.env.ALLOWED_METHODS ?? 'GET, POST, PATCH'}`);
    console.log('%%stopHint%%');
  });
  process.on('SIGINT', () => server.close(() => console.log('%%apiClosed%%')));
}
