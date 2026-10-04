// The wishlist records API under test (read-only). Every record is one JSON file in dataDir.
//   POST /records { id, name, price } → 201 and the file <id>.json
//     400 VALIDATION_FAILED when id is not "w-" plus 2–4 digits (ids become file names)
//     413 PAYLOAD_TOO_LARGE when the body is over 1024 bytes
//   GET /records/<id> → 200 with the stored record, 404 when there is none
// The checks call useDefect() to switch on one hidden defect at a time and see whether your tests notice.
import http from 'node:http';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

const MAX_BODY_BYTES = 1024;
let defect = null;
export function useDefect(name = null) {
  defect = name;
}

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
  const idPattern = defect === 'noIdCheck' ? /^.+$/ : /^w-\d{2,4}$/;
  const limit = defect === 'noSizeLimit' ? Infinity : MAX_BODY_BYTES;
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'POST' && url.pathname === '/records') {
        const body = await readBody(request, limit);
        if (body === null) return sendJson(response, 413, { error: { code: 'PAYLOAD_TOO_LARGE' } }, { connection: 'close' });
        const record = JSON.parse(body.toString('utf8'));
        if (typeof record.id !== 'string' || !idPattern.test(record.id)) return sendJson(response, 400, { error: { code: 'VALIDATION_FAILED' } });
        if (defect !== 'noDiskWrite') await writeFile(path.join(dataDir, `${record.id}.json`), JSON.stringify(record));
        return sendJson(response, 201, record);
      }
      const match = /^\/records\/([^/]+)$/.exec(url.pathname);
      if (request.method === 'GET' && match && /^w-\d{2,4}$/.test(match[1])) {
        const stored = await readFile(path.join(dataDir, `${match[1]}.json`), 'utf8').catch(() => null);
        return stored === null ? sendJson(response, 404, { error: { code: 'NOT_FOUND' } }) : sendJson(response, 200, JSON.parse(stored));
      }
      sendJson(response, 404, { error: { code: 'NOT_FOUND' } });
    } catch {
      sendJson(response, 500, { error: { code: 'INTERNAL' } });
    }
  });
}
