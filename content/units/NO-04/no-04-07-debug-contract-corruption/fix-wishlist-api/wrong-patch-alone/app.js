// The wishlist API, as it was released. Users report broken lists, stack traces and double wishes.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { WishNotFound, toErrorResponse, validationResponse } from './error-response.js';
import { sendJson } from './http-helpers.js';
import { checkWish } from './wish-rules.js';

export function createApp() {
  // A fresh store for every app.
  const wishes = [
    { id: 'w-01', name: '%%headphones%%', price: 80, acquired: false, category: '%%tech%%' },
    { id: 'w-02', name: '%%lamp%%', price: 45, acquired: false, category: '%%home%%' },
  ];
  const replies = new Map(); // Idempotency-Key → { text, status, body }
  let nextNumber = 3;

  async function handle(request, response, requestId) {
    const url = new URL(request.url, 'http://localhost');
    const [collection, id, extra] = url.pathname.split('/').filter((part) => part !== '');
    if (collection !== 'records') throw new WishNotFound(url.pathname);
    let text = '';
    for await (const chunk of request) text += chunk;
    const reply = ({ status, body }) => sendJson(response, status, body);

    if (!id && request.method === 'GET') {
      const list = url.searchParams.get('sort') === 'name' ? wishes.toSorted((a, b) => a.name.localeCompare(b.name, 'en')) : wishes;
      return sendJson(response, 200, list);
    }

    if (!id && request.method === 'POST') {
      const key = request.headers['idempotency-key']; // Node.js gives header names in lowercase
      if (key && replies.has(key)) {
        const saved = replies.get(key);
        if (saved.text !== text) return sendJson(response, 422, { error: { code: 'IDEMPOTENCY_KEY_REUSED', messageKey: 'errors.idempotencyKeyReused', details: {}, requestId } });
        return sendJson(response, saved.status, saved.body);
      }
      const result = checkWish(JSON.parse(text || 'null'));
      if (!result.ok) return reply(validationResponse(result.errors, requestId));
      const wish = { id: `w-${String(nextNumber++).padStart(2, '0')}`, ...result.value };
      wishes.push(wish);
      if (key) replies.set(key, { text, status: 201, body: wish });
      return sendJson(response, 201, wish);
    }

    const index = wishes.findIndex((wish) => wish.id === id);
    if (index === -1) throw new WishNotFound(id);

    if (extra === 'share' && request.method === 'GET') {
      // Share links are not built yet: this unfinished route throws a TypeError on purpose.
      return sendJson(response, 200, { url: wishes[index].shareLink.url });
    }
    if (!extra && request.method === 'GET') return sendJson(response, 200, wishes[index]);
    if (!extra && request.method === 'PATCH') {
      // Mistake: the patch alone is checked as if it were a whole wish, so a patch without a name is refused.
      const patch = JSON.parse(text || '{}');
      const result = checkWish(patch);
      if (!result.ok) return reply(validationResponse(result.errors, requestId));
      wishes[index] = { ...wishes[index], ...patch, id };
      return sendJson(response, 200, wishes[index]);
    }
    throw new WishNotFound(url.pathname);
  }

  return http.createServer((request, response) => {
    const requestId = randomUUID();
    response.setHeader('x-request-id', requestId);
    handle(request, response, requestId).catch((error) => {
      const { status, body } = toErrorResponse(error, requestId);
      if (status >= 500) console.error(`[${requestId}]`, error); // the stack stays in the server's log
      sendJson(response, status, body);
    });
  });
}
