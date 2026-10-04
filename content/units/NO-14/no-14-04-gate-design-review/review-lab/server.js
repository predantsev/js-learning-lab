// The planner's server (the PR adds the POST /sync line).
import http from 'node:http';
import { sendJson } from './http-helpers.js';
import { createSyncRoute } from './sync.js';

export function createServer(store) {
  const routes = {
    'GET /tasks': (request, response) => sendJson(response, 200, store.all()),
    'POST /sync': createSyncRoute(store),
  };
  return http.createServer(async (request, response) => {
    const route = routes[`${request.method} ${request.url}`];
    if (!route) return sendJson(response, 404, { error: { code: 'NOT_FOUND' } });
    try {
      await route(request, response);
    } catch {
      sendJson(response, 500, { error: { code: 'INTERNAL' } });
    }
  });
}
