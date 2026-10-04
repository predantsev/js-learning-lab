// logRequest(handler, { log }): a request listener that gives every request an id, returns it in
// X-Request-Id and writes exactly one structured log entry per request through log(entry).
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
        route: new URL(request.url, 'http://localhost').pathname, // never the query: it can hold secrets
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
