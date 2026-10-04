import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { seedNotes } from './data.js';

export const MAX_BODY_BYTES = 1024;

class HttpError extends Error {
  constructor(status, message, headers = {}) {
    super(message);
    this.status = status;
    this.headers = headers;
  }
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.byteLength;
    if (total > MAX_BODY_BYTES) throw new HttpError(413, 'too large', { Connection: 'close' });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'bad json');
  }
}

export function createNotesServer() {
  const notes = seedNotes.map((note) => ({ ...note }));

  async function route(req) {
    const parts = new URL(req.url, 'http://localhost').pathname.split('/').filter(Boolean);
    if (parts[0] !== 'notes' || parts.length > 2) throw new HttpError(404, 'not found');
    if (parts.length === 1) {
      switch (req.method) {
        case 'GET':
          return [200, notes];
        case 'POST': {
          const { text } = (await readBody(req)) ?? {};
          if (typeof text !== 'string' || !text.trim() || text.length > 200) throw new HttpError(400, 'invalid text');
          const note = { id: `n-${String(notes.length + 1).padStart(2, '0')}`, text: text.trim() };
          notes.push(note);
          return [201, note];
        }
        default:
          throw new HttpError(405, 'method not allowed', { Allow: 'GET, POST' });
      }
    }
    if (req.method !== 'GET') throw new HttpError(405, 'method not allowed', { Allow: 'GET' });
    const note = notes.find((n) => n.id === decodeURIComponent(parts[1]));
    if (!note) throw new HttpError(404, 'note not found');
    return [200, note];
  }

  return http.createServer(async (req, res) => {
    let status;
    let value;
    let headers = {};
    try {
      [status, value] = await route(req);
    } catch (error) {
      status = error.status ?? 500;
      value = { error: error.status ? error.message : 'internal error' };
      headers = error.headers ?? {};
    }
    const body = Buffer.from(JSON.stringify(value));
    res.writeHead(status, { ...headers, 'Content-Type': 'application/json', 'Content-Length': body.length });
    res.end(body);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createNotesServer();
  const port = Number(process.env.PORT ?? 7330);
  server.listen(port, '127.0.0.1', () => console.log(`listening on 127.0.0.1:${port}`));
  process.once('SIGINT', () => server.close(() => console.log('stopped')));
}
