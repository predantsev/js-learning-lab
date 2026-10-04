// Misconception: the full request URL is the most useful route to log.
import { randomUUID } from 'node:crypto';

const WELL_FORMED_ID = /^[A-Za-z0-9-]{8,64}$/;
const levelFor = (status) => (status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info');

export function logRequest(handler, { log }) {
  return async (request, response) => {
    const started = performance.now();
    const incoming = request.headers['x-request-id'];
    const requestId = typeof incoming === 'string' && WELL_FORMED_ID.test(incoming) ? incoming : randomUUID();
    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      log({
        time: new Date().toISOString(),
        level: levelFor(response.statusCode),
        requestId,
        method: request.method,
        route: request.url,
        status: response.statusCode,
        durationMs: Math.round(performance.now() - started),
      });
    });

    try {
      await handler(request, response, { requestId });
    } catch {
      response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: { code: 'INTERNAL', requestId } }));
    }
  };
}
