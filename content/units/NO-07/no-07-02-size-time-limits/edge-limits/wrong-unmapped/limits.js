// Misconception: checking Content-Length is enough, so a body that grows too large is just an internal error.
import http from 'node:http';
import { MalformedJsonError, PayloadTooLargeError, readJsonBody } from './body.js';

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(value));
}

// "Connection: close" ends the connection after the answer instead of waiting for the unread body.
const tooLarge = (response) => sendJson(response, 413, { error: { code: 'PAYLOAD_TOO_LARGE' } }, { connection: 'close' });

export function createLimitedServer(handler, limits) {
  const options = {
    headersTimeout: limits.headersTimeoutMs,
    requestTimeout: limits.requestTimeoutMs,
    connectionsCheckingInterval: 100,
  };
  return http.createServer(options, async (request, response) => {
    // Fast path: an honest client that announces a body too large is refused before a byte is read.
    if (Number(request.headers['content-length'] ?? 0) > limits.maxBodyBytes) return tooLarge(response);
    try {
      const body = await readJsonBody(request, limits.maxBodyBytes);
      await handler(request, response, body);
    } catch (error) {
      if (error instanceof MalformedJsonError) return sendJson(response, 400, { error: { code: 'MALFORMED_JSON' } });
      sendJson(response, 500, { error: { code: 'INTERNAL' } });
    }
  });
}
