// logRequest(handler, { log }): a request listener that gives every request an id, returns it in
// X-Request-Id and writes exactly one structured log entry per request through log(entry).
import { randomUUID } from 'node:crypto';

export function logRequest(handler, { log }) {
  return async (request, response) => {
    // TODO: choose the request id, return it in a header, log one entry when the response finishes,
    // and answer 500 when the handler throws.
    console.log(request.method, request.url, request.headers);
    await handler(request, response, { requestId: 'TODO' });
  };
}
