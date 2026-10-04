// A planner API with a naive edge: it validates nothing in the path or the query string.
import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { BadRequestError, resolveInside } from './paths.js';

// Report files live here; everything else in the folder is not meant for clients.
const REPORTS_DIR = path.resolve('data/reports');

function sendJson(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

export function createApp(repo) {
  async function handle(request, response) {
    const url = new URL(request.url, 'http://localhost');
    const parts = url.pathname.split('/').filter((part) => part !== '');

    if (request.method === 'GET' && url.pathname === '/tasks') {
      const limit = Number(url.searchParams.get('limit') ?? 10);
      const sort = url.searchParams.get('sort') ?? 'dueDate';
      return sendJson(response, 200, await repo.list({ limit, sort }));
    }

    if (request.method === 'GET' && parts[0] === 'reports' && parts.length === 2) {
      const name = decodeURIComponent(parts[1]);
      const file = path.join(REPORTS_DIR, name);
      response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      return response.end(await readFile(file, 'utf8'));
    }

    sendJson(response, 404, { error: { code: 'NOT_FOUND' } });
  }

  return http.createServer((request, response) => {
    // The central handler: every error thrown by `handle` ends up here.
    handle(request, response).catch((error) => {
      if (error instanceof BadRequestError) return sendJson(response, 400, { error: { code: 'BAD_REQUEST', details: error.details } });
      if (error.code === 'ENOENT') return sendJson(response, 404, { error: { code: 'NOT_FOUND' } });
      console.error(`[server] ${error.name}: ${error.message}`);
      sendJson(response, 500, { error: { code: 'INTERNAL' } });
    });
  });
}
