// A habit server with a route table and a bounded JSON body reader. It sends itself five requests.
import http from 'node:http';

const MAX_BODY_BYTES = 16 * 1024;
const habits = [
  { id: 'h-01', name: '%%habit1%%', active: true },
  { id: 'h-02', name: '%%habit2%%', active: true },
  { id: 'h-05', name: '%%habit5%%', active: false },
];

function sendJson(res, status, value) {
  const text = JSON.stringify(value);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text) });
  res.end(text);
}

// Trusts the Content-Length the client declared: refuses a declared size over the limit,
// otherwise reads the whole body. (A client may also send no Content-Length at all.)
async function readBody(req, maxBytes) {
  const declared = Number(req.headers['content-length'] ?? 0);
  if (declared > maxBytes) throw Object.assign(new Error('body too large'), { status: 413 });
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk); // every chunk is a Buffer
  return Buffer.concat(chunks).toString('utf8');
}

const routes = [
  {
    method: 'GET', pattern: /^\/records$/,
    handler: (req, res, url) => {
      const status = url.searchParams.get('status'); // "active", "paused" or null
      const list = status === null ? habits : habits.filter((h) => h.active === (status === 'active'));
      sendJson(res, 200, list);
    },
  },
  {
    method: 'GET', pattern: /^\/records\/([^/]+)$/,
    handler: (req, res, url, [id]) => {
      const habit = habits.find((h) => h.id === id);
      if (habit) sendJson(res, 200, habit);
      else sendJson(res, 404, { error: 'not found', id });
    },
  },
  {
    method: 'POST', pattern: /^\/records$/,
    handler: async (req, res) => {
      const text = await readBody(req, MAX_BODY_BYTES);
      let input;
      try {
        input = JSON.parse(text);
      } catch {
        return sendJson(res, 400, { error: 'malformed JSON' });
      }
      sendJson(res, 201, { id: 'h-07', ...input });
    },
  },
];

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost'); // req.url is relative: the base only completes it
    const sameRoute = routes.filter((route) => route.pattern.test(url.pathname));
    if (sameRoute.length === 0) return sendJson(res, 404, { error: 'not found' });
    const route = sameRoute.find((r) => r.method === req.method);
    if (!route) {
      res.setHeader('allow', sameRoute.map((r) => r.method).join(', '));
      return sendJson(res, 405, { error: 'method not allowed' });
    }
    const params = url.pathname.match(route.pattern).slice(1).map(decodeURIComponent);
    await route.handler(req, res, url, params);
  } catch (error) {
    if (res.headersSent) return res.end();
    // decodeURIComponent throws a URIError on a broken encoding such as /records/%E0: the client's mistake.
    if (error instanceof URIError) return sendJson(res, 400, { error: 'malformed path' });
    if (error.status === 413) res.setHeader('connection', 'close');
    sendJson(res, error.status ?? 500, { error: error.status ? error.message : 'internal error' });
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const requests = [
  ['GET', '/records?status=active'],
  ['GET', '/records/h-02'],
  ['POST', '/records', JSON.stringify({ name: '%%habit7%%', note: 'x'.repeat(64 * 1024) })],
  ['POST', '/records', '{"name": "%%habit7%%'],
  ['POST', '/records', JSON.stringify({ name: '%%habit7%%' })],
];
try {
  for (const [method, path, body] of requests) {
    const response = await fetch(base + path, { method, body, signal: AbortSignal.timeout(2000) });
    const size = body === undefined ? '' : ` (${Buffer.byteLength(body)} B)`;
    console.log(`${method} ${path}${size} → ${response.status} ${await response.text()}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
