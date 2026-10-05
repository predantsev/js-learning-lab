// Another valid approach: measure with Date.now() and log from the 'close' event of the response.
import { randomUUID } from 'node:crypto';

export function logRequest(handler, { log }) {
  return (request, response) => {
    const start = Date.now();
    const header = request.headers['x-request-id'];
    const wellFormed = typeof header === 'string' && header.length >= 8 && header.length <= 64 && /^[\w-]+$/.test(header) && !header.includes('_');
    const requestId = wellFormed ? header : randomUUID();
    response.setHeader('x-request-id', requestId);
    response.once('close', () => {
      const status = response.statusCode;
      log({
        time: new Date(start).toISOString(),
        level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
        requestId,
        method: request.method,
        route: request.url.split('?')[0],
        status,
        durationMs: Date.now() - start,
      });
    });
    Promise.resolve()
      .then(() => handler(request, response, { requestId }))
      .catch(() => {
        response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: { code: 'INTERNAL', requestId } }));
      });
  };
}
