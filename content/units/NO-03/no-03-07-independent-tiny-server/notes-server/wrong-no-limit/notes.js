import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { seedNotes } from './data.js';

export const MAX_BODY_BYTES = 1024;

function sendJson(res, status, value) {
  const text = JSON.stringify(value);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text) });
  res.end(text);
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    const onData = (chunk) => {
      size += chunk.length;
      chunks.push(chunk);
    };
    const onEnd = () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(httpError(400, 'malformed JSON'));
      }
    };
    req.on('data', onData);
    req.on('end', onEnd);
    req.on('error', reject);
  });
}

// Returns an http.Server (not listening yet) that serves the notes. See the task for the routes.
export function createNotesServer() {
  const notes = seedNotes.map((note) => ({ ...note }));
  let nextId = notes.length + 1;

  const routes = [
    { method: 'GET', pattern: /^\/notes$/, handle: (req, res) => sendJson(res, 200, notes) },
    {
      method: 'POST', pattern: /^\/notes$/,
      handle: async (req, res) => {
        const input = await readJsonBody(req, MAX_BODY_BYTES);
        if (typeof input?.text !== 'string' || input.text.trim() === '' || input.text.length > 200) {
          throw httpError(400, 'text must be a non-empty string of at most 200 characters');
        }
        const note = { id: `n-${String(nextId++).padStart(2, '0')}`, text: input.text.trim() };
        notes.push(note);
        sendJson(res, 201, note);
      },
    },
    {
      method: 'GET', pattern: /^\/notes\/([^/]+)$/,
      handle: (req, res, [id]) => {
        const note = notes.find((n) => n.id === id);
        if (!note) throw httpError(404, 'note not found');
        sendJson(res, 200, note);
      },
    },
  ];

  return http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      const samePath = routes.filter((route) => route.pattern.test(pathname));
      if (samePath.length === 0) throw httpError(404, 'not found');
      const route = samePath.find((r) => r.method === req.method);
      if (!route) {
        res.setHeader('allow', samePath.map((r) => r.method).join(', '));
        throw httpError(405, 'method not allowed');
      }
      const params = pathname.match(route.pattern).slice(1).map(decodeURIComponent);
      await route.handle(req, res, params);
    } catch (error) {
      if (res.headersSent) return res.end();
      if (error.status === 413) res.setHeader('connection', 'close');
      if (!error.status) console.error(error);
      sendJson(res, error.status ?? 500, { error: error.status ? error.message : 'internal error' });
    }
  });
}

// Runs only with `node notes.js` in your terminal: listen on 127.0.0.1 and stop cleanly on Ctrl+C.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 7330);
  const server = createNotesServer();
  server.listen(port, '127.0.0.1', () => console.log(`Notes server on http://127.0.0.1:${port} (Ctrl+C to stop)`));
  process.on('SIGINT', () => {
    console.log('Closing…');
    server.close(() => console.log('Closed.'));
  });
}
