// Misconception: logging the full URL makes the log more useful.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { MalformedJsonError, PayloadTooLargeError, readJsonBody } from './body.js';
import { createNotesHandler } from './notes.js';

export const LIMITS = { maxBodyBytes: 2048, headersTimeoutMs: 500, requestTimeoutMs: 1000, maxRequests: 5, windowMs: 1000 };
const LOOPBACK = ['127.0.0.1', '::1', 'localhost'];

export function bindHost(env, log) {
  const host = env.HOST ?? '127.0.0.1';
  if (!LOOPBACK.includes(host)) log({ level: 'warn', msg: 'listening off loopback', host });
  return host;
}

function clientIp(request, trustedProxies) {
  const peer = request.socket.remoteAddress;
  if (!trustedProxies.includes(peer)) return peer;
  const chain = String(request.headers['x-forwarded-for'] ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);
  for (let i = chain.length - 1; i >= 0; i -= 1) if (!trustedProxies.includes(chain[i])) return chain[i];
  return peer;
}

export function createHardenedServer({ log, trustedProxies = [], allowedOrigin }) {
  const handleNotes = createNotesHandler();
  const windows = new Map(); // client → { start, count }
  const options = { headersTimeout: LIMITS.headersTimeoutMs, requestTimeout: LIMITS.requestTimeoutMs, connectionsCheckingInterval: 100 };

  return http.createServer(options, async (request, response) => {
    const started = performance.now();
    const requestId = randomUUID();
    response.setHeader('x-request-id', requestId);
    response.on('finish', () => {
      const status = response.statusCode;
      log({
        time: new Date().toISOString(),
        level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
        requestId,
        method: request.method,
        route: request.url,
        status,
        durationMs: Math.round(performance.now() - started),
      });
    });
    const send = (status, value, headers = {}) => {
      response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
      response.end(JSON.stringify(value));
    };

    // CORS tells browsers which page may READ the answer. It is not authentication: notes.js still checks the token.
    const fromAllowedOrigin = request.headers.origin === allowedOrigin;
    if (fromAllowedOrigin) {
      response.setHeader('access-control-allow-origin', allowedOrigin);
      response.setHeader('vary', 'Origin');
    }
    if (request.method === 'OPTIONS') {
      if (!fromAllowedOrigin) return send(403, { error: { code: 'ORIGIN_NOT_ALLOWED', requestId } });
      response.writeHead(204, { 'access-control-allow-methods': 'GET, POST', 'access-control-allow-headers': 'authorization, content-type' });
      return response.end();
    }

    // Rate limit: a fixed window per client; the client comes from clientIp, so a forged header cannot change it.
    const client = clientIp(request, trustedProxies);
    const now = Date.now();
    const current = windows.get(client);
    const window = current && now - current.start < LIMITS.windowMs ? current : { start: now, count: 0 };
    window.count += 1;
    windows.set(client, window);
    if (window.count > LIMITS.maxRequests) {
      const retryAfter = String(Math.max(1, Math.ceil((window.start + LIMITS.windowMs - now) / 1000)));
      return send(429, { error: { code: 'TOO_MANY_REQUESTS', requestId } }, { 'retry-after': retryAfter });
    }

    const tooLarge = () => send(413, { error: { code: 'PAYLOAD_TOO_LARGE', requestId } }, { connection: 'close' });
    if (Number(request.headers['content-length'] ?? 0) > LIMITS.maxBodyBytes) return tooLarge();
    try {
      const body = await readJsonBody(request, LIMITS.maxBodyBytes);
      await handleNotes(request, response, { body, requestId });
    } catch (error) {
      if (error instanceof PayloadTooLargeError) return tooLarge();
      if (error instanceof MalformedJsonError) return send(400, { error: { code: 'MALFORMED_JSON', requestId } });
      send(500, { error: { code: 'INTERNAL', requestId } });
    }
  });
}
