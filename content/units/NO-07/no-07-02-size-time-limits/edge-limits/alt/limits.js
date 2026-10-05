// Another valid approach: set the limits as server properties and keep the size rules in one helper.
import http from 'node:http';
import { MalformedJsonError, PayloadTooLargeError, readJsonBody } from './body.js';

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(value));
}

export function createLimitedServer(handler, limits) {
  async function readWithinLimit(request) {
    const declared = Number.parseInt(request.headers['content-length'] ?? '0', 10);
    if (declared > limits.maxBodyBytes) throw new PayloadTooLargeError(limits.maxBodyBytes);
    return readJsonBody(request, limits.maxBodyBytes);
  }

  const server = http.createServer({ connectionsCheckingInterval: 100 }, async (request, response) => {
    try {
      await handler(request, response, await readWithinLimit(request));
    } catch (error) {
      if (error instanceof PayloadTooLargeError) {
        return sendJson(response, 413, { error: { code: 'PAYLOAD_TOO_LARGE' } }, { Connection: 'close' });
      }
      if (error instanceof MalformedJsonError) return sendJson(response, 400, { error: { code: 'MALFORMED_JSON' } });
      sendJson(response, 500, { error: { code: 'INTERNAL' } });
    }
  });
  server.headersTimeout = limits.headersTimeoutMs;
  server.requestTimeout = limits.requestTimeoutMs;
  return server;
}
