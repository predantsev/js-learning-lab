// A planner server with four seeded defects, and a client that waits at most 1 s per request.
import http from 'node:http';

const tasks = [
  { id: 't-01', title: '%%task1%%', done: false },
  { id: 't-02', title: '%%task2%%', done: false },
];

function sendJson(res, status, value) {
  const text = JSON.stringify(value);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text) });
  res.end(text);
}

// A warm-up that was supposed to call markWarm() after loading — but nothing ever calls it.
let markWarm;
const warm = new Promise((resolve) => { markWarm = resolve; });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const item = /^\/records\/([^/]+)$/.exec(url.pathname);

  if (req.method === 'GET' && url.pathname === '/records') {
    const status = url.searchParams.get('status');
    if (status !== null && status !== 'pending' && status !== 'done') {
      res.statusCode = 400; // A: the status is set, but the answer is never sent
      return;
    }
    return sendJson(res, 200, tasks);
  }
  if (req.method === 'GET' && item) {
    const task = tasks.find((t) => t.id === item[1]);
    if (!task) return sendJson(res, 200, { error: 'task not found' }); // B
    return sendJson(res, 200, task);
  }
  if (req.method === 'GET' && url.pathname === '/summary') {
    await warm; // C
    return sendJson(res, 200, { pending: tasks.filter((t) => !t.done).length });
  }
  if (req.method === 'POST' && url.pathname === '/records') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk); // a tiny example: no body limit here
    const input = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    if (typeof input.title !== 'string' || input.title.trim() === '') {
      return sendJson(res, 200, { error: 'title is required' }); // D
    }
    return sendJson(res, 201, { id: 't-07', title: input.title, done: false });
  }
  sendJson(res, 404, { error: 'not found' });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const requests = [
  ['A', 'GET', '/records?status=later'],
  ['B', 'GET', '/records/t-99'],
  ['C', 'GET', '/summary'],
  ['D', 'POST', '/records', JSON.stringify({ title: '' })],
];
try {
  for (const [label, method, path, body] of requests) {
    const started = performance.now();
    try {
      const response = await fetch(base + path, { method, body, signal: AbortSignal.timeout(1000) });
      console.log(`${label} ${method} ${path} → ${response.status}, ok: ${response.ok}, ${await response.text()}`);
    } catch (error) {
      console.log(`${label} ${method} ${path} → %%noAnswer%% ${Math.round(performance.now() - started)} ms (${error.name})`);
    }
  }
} finally {
  server.closeAllConnections();
  server.close();
}
