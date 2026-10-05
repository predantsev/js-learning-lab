// createLimitedServer(handler, limits): the edge of the habits API. It reads the JSON body and calls
// handler(request, response, body); every error that comes out ends up in the one catch here.
//   limits = { maxBodyBytes, headersTimeoutMs, requestTimeoutMs }
import http from 'node:http';
import { MalformedJsonError, PayloadTooLargeError, readJsonBody } from './body.js';

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(value));
}

export function createLimitedServer(handler, limits) {
  // TODO: the two timeouts, an early 413 for a declared body over the limit, and 413 for a PayloadTooLargeError.
  return http.createServer(async (request, response) => {
    try {
      const body = await readJsonBody(request, limits.maxBodyBytes);
      await handler(request, response, body);
    } catch (error) {
      if (error instanceof MalformedJsonError) return sendJson(response, 400, { error: { code: 'MALFORMED_JSON' } });
      sendJson(response, 500, { error: { code: 'INTERNAL' } });
    }
  });
}
