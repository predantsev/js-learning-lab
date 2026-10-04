// The wishlist lab service (read-only): POST /login with throttling, POST /wishes behind a
// session cookie and the Origin check. The web client lives at http://127.0.0.1:4310.
import crypto from 'node:crypto';
import http from 'node:http';
import { HttpError } from './http-error.js';
import { createLoginLimiter, requireSameOrigin } from './guards.js';

export const ALLOWED_ORIGINS = ['http://127.0.0.1:4310'];
const PASSWORDS = new Map([['u-01', 'sunflower-42'], ['u-02', 'river-stone-7']]); // lab only: lesson 2 hashes them

function send(response, status, value, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(value === undefined ? '' : JSON.stringify(value));
}

export function createApp({ now = Date.now } = {}) {
  const limiter = createLoginLimiter({ now });
  const sessions = new Map();

  async function handle(request, response) {
    requireSameOrigin(request, ALLOWED_ORIGINS);
    const path = new URL(request.url, 'http://localhost').pathname;
    if (request.method === 'POST' && path === '/login') {
      let text = '';
      for await (const chunk of request) {
        text += chunk;
        if (text.length > 1024) throw new HttpError(413, 'PAYLOAD_TOO_LARGE');
      }
      const { user, password } = JSON.parse(text || '{}');
      const address = request.socket.remoteAddress;
      const wait = limiter.blockedFor(user, address);
      if (wait > 0) return send(response, 429, { error: { code: 'TOO_MANY_ATTEMPTS', details: {} } }, { 'retry-after': String(wait) });
      if (PASSWORDS.get(user) !== password) {
        limiter.recordFailure(user, address);
        return send(response, 401, { error: { code: 'BAD_CREDENTIALS', details: {} } });
      }
      const id = crypto.randomBytes(32).toString('base64url');
      sessions.set(id, user);
      return send(response, 204, undefined, { 'set-cookie': `sid=${id}; HttpOnly; SameSite=Lax; Path=/` });
    }
    const user = sessions.get(/(?:^|;\s*)sid=([^;]*)/.exec(request.headers.cookie ?? '')?.[1]);
    if (!user) throw new HttpError(401, 'UNAUTHENTICATED');
    if (request.method === 'GET' && path === '/wishes') return send(response, 200, [{ id: 'w-02', name: '%%lamp%%' }]);
    if (request.method === 'POST' && path === '/wishes') return send(response, 201, { id: 'w-07', ownerId: user });
    throw new HttpError(404, 'NOT_FOUND');
  }

  return http.createServer((request, response) => {
    handle(request, response).catch((error) => {
      if (error instanceof HttpError) send(response, error.status, { error: { code: error.code, details: {} } });
      else send(response, 500, { error: { code: 'INTERNAL', details: {} } });
    });
  });
}
