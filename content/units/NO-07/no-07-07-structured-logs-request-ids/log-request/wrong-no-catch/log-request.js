// Misconception: the handler never throws, so the wrapper needs no catch.
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

    await handler(request, response, { requestId });
  };
}
