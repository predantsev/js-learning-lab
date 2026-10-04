// The habit tracker lab service (read-only): POST /login, GET /habits, POST /logout.
import http from 'node:http';
import { readJsonBody, sendEmpty, sendError, sendJson } from './http-helpers.js';
import { checkPassword } from './users.js';
import { createSession, destroySession, readSession } from './sessions.js';

const habitsOf = {
  'u-01': [{ id: 'h-01', name: '%%water%%' }, { id: 'h-02', name: '%%walk%%' }],
  'u-02': [{ id: 'h-03', name: '%%reading%%' }],
};

export function createApp() {
  async function handle(request, response) {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (request.method === 'POST' && path === '/login') {
      const body = await readJsonBody(request);
      if (!checkPassword(body?.userId, body?.password)) return sendError(response, 401, 'BAD_CREDENTIALS');
      const { cookie } = createSession(body.userId);
      return sendEmpty(response, 204, { 'set-cookie': cookie });
    }
    const session = readSession(request);
    if (!session) return sendError(response, 401, 'UNAUTHENTICATED');
    if (request.method === 'POST' && path === '/logout') {
      destroySession(session.id);
      return sendEmpty(response, 204, { 'set-cookie': 'sid=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/' });
    }
    if (request.method === 'GET' && path === '/habits') return sendJson(response, 200, habitsOf[session.userId] ?? []);
    return sendError(response, 404, 'NOT_FOUND');
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => sendError(response, 500, 'INTERNAL'));
  });
}
