// The planner tasks service (read-only): GET and DELETE /tasks/:id.
// Each route function returns { status, body? } or throws an HttpError.
import http from 'node:http';
import { HttpError, sendError, sendJson } from './http-helpers.js';
import { createRepo } from './repo.js';
import { deleteTask, readTask } from './routes.js';

export function createApp({ repo = createRepo() } = {}) {
  return http.createServer((request, response) => {
    try {
      const match = /^\/tasks\/([^/]+)$/.exec(new URL(request.url, 'http://localhost').pathname);
      if (!match) throw new HttpError(404, 'NOT_FOUND');
      let result;
      if (request.method === 'GET') result = readTask(request, match[1], repo);
      else if (request.method === 'DELETE') result = deleteTask(request, match[1], repo);
      else throw new HttpError(405, 'METHOD_NOT_ALLOWED');
      if (result.body === undefined) {
        response.writeHead(result.status);
        response.end();
      } else sendJson(response, result.status, result.body);
    } catch (error) {
      sendError(response, error);
    }
  });
}
