// A small expenses API that keeps every expense as one JSON file in dataDir.
//   POST /expenses       { id, label, amountMinor } → 201, file <id>.json; 400 for a bad id; 413 over 1024 bytes
//   GET  /expenses/<id>  → 200 with the stored expense, 404 when there is none
import http from 'node:http';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

const MAX_BODY_BYTES = 1024;
const ID = /^e-\d{2,4}$/; // allowlist of ids: they become file names

// Collects the body and counts its bytes as they arrive (lesson no-07-02): as soon as there are more
// than `limit`, it stops reading and resolves null, whatever Content-Length said.
function readBody(request, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const onData = (chunk) => {
      size += chunk.length;
      if (size <= limit) return chunks.push(chunk);
      request.off('data', onData);
      request.pause(); // read nothing more
      resolve(null);
    };
    request.on('data', onData);
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(value));
}

export function createApp({ dataDir }) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'POST' && url.pathname === '/expenses') {
        const tooLarge = () => sendJson(response, 413, { error: { code: 'PAYLOAD_TOO_LARGE' } }, { connection: 'close' });
        if (Number(request.headers['content-length'] ?? 0) > MAX_BODY_BYTES) return tooLarge(); // the fast path
        const body = await readBody(request, MAX_BODY_BYTES); // the real limit, for a body without Content-Length too
        if (body === null) return tooLarge();
        const expense = JSON.parse(body.toString('utf8'));
        if (typeof expense.id !== 'string' || !ID.test(expense.id)) return sendJson(response, 400, { error: { code: 'VALIDATION_FAILED' } });
        await writeFile(path.join(dataDir, `${expense.id}.json`), JSON.stringify(expense));
        return sendJson(response, 201, expense);
      }
      const match = /^\/expenses\/([^/]+)$/.exec(url.pathname);
      if (request.method === 'GET' && match) {
        if (!ID.test(match[1])) return sendJson(response, 400, { error: { code: 'VALIDATION_FAILED' } });
        const stored = await readFile(path.join(dataDir, `${match[1]}.json`), 'utf8').catch(() => null);
        return stored === null ? sendJson(response, 404, { error: { code: 'NOT_FOUND' } }) : sendJson(response, 200, JSON.parse(stored));
      }
      sendJson(response, 404, { error: { code: 'NOT_FOUND' } });
    } catch {
      sendJson(response, 500, { error: { code: 'INTERNAL' } });
    }
  });
}
