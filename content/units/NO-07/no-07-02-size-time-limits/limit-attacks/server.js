// An expenses API with three limits: body size, header/request time and requests per client.
import http from 'node:http';

export const LIMITS = {
  maxBodyBytes: 64 * 1024, // the body of one request
  headersTimeoutMs: 2000, // all headers must arrive within this time
  requestTimeoutMs: 4000, // the whole request, body included
  maxRequests: 3, // per client address …
  windowMs: 1000, // … in this window
};

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(value));
}

export function createServer() {
  const windows = new Map(); // client address → { start, count }

  return http.createServer(
    { headersTimeout: LIMITS.headersTimeoutMs, requestTimeout: LIMITS.requestTimeoutMs, connectionsCheckingInterval: 100 },
    (request, response) => {
      // Rate limit: a fixed window per client address. Old windows are replaced, so the map stays small.
      const client = request.socket.remoteAddress;
      const now = Date.now();
      const current = windows.get(client);
      const window = current && now - current.start < LIMITS.windowMs ? current : { start: now, count: 0 };
      window.count += 1;
      windows.set(client, window);
      if (window.count > LIMITS.maxRequests) {
        const retryAfter = Math.ceil((window.start + LIMITS.windowMs - now) / 1000);
        console.log(`[server] 429 ${request.method} ${request.url}`);
        return sendJson(response, 429, { error: { code: 'TOO_MANY_REQUESTS' } }, { 'retry-after': String(retryAfter) });
      }

      if (request.method === 'GET') return sendJson(response, 200, { items: [] });

      // Size limit: count the real bytes of every chunk; stop as soon as there are too many.
      let size = 0;
      request.on('data', (chunk) => {
        size += chunk.length;
        if (size > LIMITS.maxBodyBytes && !response.headersSent) {
          console.log(`[server] 413 after ${size} bytes`);
          request.pause(); // read nothing more
          sendJson(response, 413, { error: { code: 'PAYLOAD_TOO_LARGE' } }, { connection: 'close' });
        }
      });
      request.on('end', () => {
        if (!response.headersSent) sendJson(response, 201, { receivedBytes: size });
      });
    },
  );
}
