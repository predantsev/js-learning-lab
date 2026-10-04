// A habits API whose handler logs three steps of every request. Reads take different times,
// so the steps of concurrent requests end up mixed in the log.
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const habits = { 'h-01': { name: '%%exercise%%' }, 'h-03': { name: '%%water%%' } };
const READ_MS = { 'h-01': 40, 'h-03': 10 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createApp({ log }) {
  return http.createServer(async (request, response) => {
    const requestId = randomUUID();
    response.setHeader('x-request-id', requestId);
    const id = request.url.split('/')[2];
    log('info', `start ${request.method} ${request.url}`, { requestId });
    await sleep(READ_MS[id] ?? 25);
    log('info', 'repository read finished', { requestId });
    const habit = habits[id];
    const status = habit ? 200 : 500; // a bug: an unknown id should be 404
    log(status >= 500 ? 'error' : 'info', `end ${status}`, { requestId });
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(habit ?? { error: { code: 'INTERNAL', requestId } }));
  });
}
