// The expenses lab service. With scoped: false the one-record routes look an expense up by id
// alone (the list is already scoped, because the screen only ever showed your own expenses).
// With scoped: true every lookup also names the owner.
import http from 'node:http';
import { readJsonBody, sendEmpty, sendError, sendJson } from './http-helpers.js';
import { createRepo } from './repo.js';

// What a caller gets for an expense that exists but is not theirs.
const FOREIGN_STATUS = 404;

const labCredentials = new Map([['lab-token-u01', 'u-01'], ['lab-token-u02', 'u-02']]);

export function createApp({ scoped }) {
  const repo = createRepo();

  async function handle(request, response) {
    const userId = labCredentials.get(/^Bearer (\S+)$/.exec(request.headers.authorization ?? '')?.[1]);
    if (!userId) return sendError(response, 401, 'UNAUTHENTICATED', { 'www-authenticate': 'Bearer' });

    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/expenses' && request.method === 'GET') return sendJson(response, 200, repo.listOwned(userId));

    const id = /^\/expenses\/([^/]+)$/.exec(path)?.[1];
    if (!id) return sendError(response, 404, 'NOT_FOUND');
    const expense = scoped ? repo.findOwned(id, userId) : repo.findById(id);
    if (!expense) {
      // Scoped: was there a foreign expense with this id? The caller must not be able to tell.
      const status = scoped && repo.findById(id) ? FOREIGN_STATUS : 404;
      return sendError(response, status, status === 404 ? 'NOT_FOUND' : 'FORBIDDEN');
    }
    if (request.method === 'GET') return sendJson(response, 200, expense);
    if (request.method === 'PATCH') return sendJson(response, 200, repo.update(expense, await readJsonBody(request)));
    if (request.method === 'DELETE') {
      repo.remove(expense);
      return sendEmpty(response, 204);
    }
    return sendError(response, 405, 'METHOD_NOT_ALLOWED');
  }

  return http.createServer((request, response) => {
    handle(request, response).catch(() => sendError(response, 500, 'INTERNAL'));
  });
}
