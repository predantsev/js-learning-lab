// A habits API whose central handler hands raw error details to the client and to the log.
import http from 'node:http';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { toPublicError } from './errors.js';

function sendJson(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

async function handle(request, response) {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname === '/habits') {
    // The data file was never created, so this read fails with ENOENT.
    const text = await readFile(path.resolve('data/habits.json'), 'utf8');
    return sendJson(response, 200, JSON.parse(text));
  }
  if (url.pathname === '/settings') {
    // The settings file (JSON text) has a typo: the token value is not in quotes.
    const settings = JSON.parse(await readFile('settings.txt', 'utf8'));
    return sendJson(response, 200, { theme: settings.theme });
  }
  sendJson(response, 404, { error: { code: 'NOT_FOUND' } });
}

export function createApp() {
  return http.createServer((request, response) => {
    const requestId = randomUUID();
    handle(request, response).catch((error) => {
      console.error('[server] failed', request.headers, error.message);
      sendJson(response, 500, { error: error.message });
    });
  });
}
