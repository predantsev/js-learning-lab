// Misconception: one request timeout also covers a client that sends its headers slowly enough.
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
      if (error instanceof PayloadTooLargeError) return tooLarge(response);
      if (error instanceof MalformedJsonError) return sendJson(response, 400, { error: { code: 'MALFORMED_JSON' } });
      sendJson(response, 500, { error: { code: 'INTERNAL' } });
    }
  });
}
