// The bookmarks lab service. Write createApp({ env, clock }) by the task; it returns an http.Server.
import http from 'node:http';
import { readJsonBody, sendError, sendJson } from './http-helpers.js';
import { verifyPassword } from './passwords.js';
import { seedBookmarks, users } from './users.js';

export const WEB_CLIENT = 'http://127.0.0.1:4310';

export function createApp({ env, clock = { now: () => Date.now() } }) {
  return http.createServer((request, response) => {
    sendError(response, 501, 'NOT_IMPLEMENTED');
  });
}
