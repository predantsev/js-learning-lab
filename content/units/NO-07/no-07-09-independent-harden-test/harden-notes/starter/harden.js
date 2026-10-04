// The edge of the notes API. Harden it (the task lists every rule).
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { MalformedJsonError, PayloadTooLargeError, readJsonBody } from './body.js';
import { createNotesHandler } from './notes.js';

export const LIMITS = { maxBodyBytes: 2048, headersTimeoutMs: 500, requestTimeoutMs: 1000, maxRequests: 5, windowMs: 1000 };

export function bindHost(env, log) {
  return env.HOST ?? '0.0.0.0';
}

export function createHardenedServer({ log, trustedProxies = [], allowedOrigin }) {
  const handleNotes = createNotesHandler();
  return http.createServer(async (request, response) => {
    response.setHeader('access-control-allow-origin', '*');
    console.log(request.method, request.url, request.headers);
    try {
      const body = await readJsonBody(request, Infinity);
      await handleNotes(request, response, { body, requestId: randomUUID() });
    } catch (error) {
      response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: { code: 'INTERNAL', message: String(error) } }));
    }
  });
}
