// Another valid approach: small edge steps run in order, a sliding-window rate limit that keeps the
// times of recent requests, and the two timeouts set as server properties.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { MalformedJsonError, PayloadTooLargeError, readJsonBody } from './body.js';
import { createNotesHandler } from './notes.js';

export const LIMITS = { maxBodyBytes: 2048, headersTimeoutMs: 500, requestTimeoutMs: 1000, maxRequests: 5, windowMs: 1000 };

export function bindHost(env, log) {
  const host = env.HOST || '127.0.0.1';
  const loopback = host === '127.0.0.1' || host === '::1' || host === 'localhost';
  if (!loopback) log({ level: 'warn', msg: `the server listens on ${host}, reachable from other computers` });
  return host;
}

// The client behind trusted proxies: walk the chain (header entries, then the socket) from the right.
function clientOf(request, trustedProxies) {
  const forwarded = request.headers['x-forwarded-for'];
  const chain = typeof forwarded === 'string' ? forwarded.split(',').map((part) => part.trim()).filter(Boolean) : [];
  const hops = [...chain, request.socket.remoteAddress];
  while (hops.length > 1 && trustedProxies.includes(hops.at(-1))) hops.pop();
  // The socket is the last hop: when it is not trusted, the loop stops at once and the header is ignored.
  return hops.at(-1);
}

const levelOf = (status) => (status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info');

export function createHardenedServer({ log, trustedProxies = [], allowedOrigin }) {
  const handleNotes = createNotesHandler();
  const recent = new Map(); // client → times of its requests within the last windowMs

  function rateLimited(client) {
    const now = Date.now();
    const times = (recent.get(client) ?? []).filter((time) => now - time < LIMITS.windowMs);
    if (times.length >= LIMITS.maxRequests) {
      recent.set(client, times);
      return Math.max(1, Math.ceil((times[0] + LIMITS.windowMs - now) / 1000)); // seconds until a slot frees
    }
    times.push(now);
    recent.set(client, times);
    return 0;
  }

  // The check interval is an option of createServer; the two timeouts are set as properties below.
  const server = http.createServer({ connectionsCheckingInterval: 100 }, async (request, response) => {
    const started = Date.now();
    const requestId = randomUUID();
    const reply = (status, body, headers = {}) => {
      response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
      response.end(body === undefined ? undefined : JSON.stringify(body));
    };
    response.setHeader('X-Request-Id', requestId);
    response.once('finish', () => log({
      time: new Date(started).toISOString(),
      level: levelOf(response.statusCode),
      requestId,
      method: request.method,
      route: request.url.split('?')[0],
      status: response.statusCode,
      durationMs: Date.now() - started,
    }));

    // CORS only tells a browser which page may read the answer; the token check stays in notes.js.
    if (allowedOrigin && request.headers.origin === allowedOrigin) {
      response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      response.setHeader('Vary', 'Origin');
      if (request.method === 'OPTIONS') {
        return reply(204, undefined, { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' });
      }
    }

    const wait = rateLimited(clientOf(request, trustedProxies));
    if (wait > 0) return reply(429, { error: { code: 'TOO_MANY_REQUESTS', requestId } }, { 'Retry-After': String(wait) });

    try {
      const body = await readJsonBody(request, LIMITS.maxBodyBytes); // counts the bytes, Content-Length or not
      await handleNotes(request, response, { body, requestId });
    } catch (error) {
      if (error instanceof PayloadTooLargeError) return reply(413, { error: { code: 'PAYLOAD_TOO_LARGE', requestId } }, { Connection: 'close' });
      if (error instanceof MalformedJsonError) return reply(400, { error: { code: 'MALFORMED_JSON', requestId } });
      reply(500, { error: { code: 'INTERNAL', requestId } });
    }
  });
  server.headersTimeout = LIMITS.headersTimeoutMs;
  server.requestTimeout = LIMITS.requestTimeoutMs;
  return server;
}
