// A small planner server. Four requests show which status and headers each branch really sends.
import http from 'node:http';

const tasks = [
  { id: 't-01', title: '%%task1%%', done: false },
  { id: 't-02', title: '%%task2%%', done: false },
];

const server = http.createServer((req, res) => {
  console.log(`  [server] ${req.method} ${req.url} (id ${req.headers['x-request-id']})`);
  try {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    if (req.url === '/records' && req.method === 'GET') {
      res.setHeader('x-total-count', String(tasks.length));
      res.end(JSON.stringify(tasks));
    } else if (req.url === '/records') {
      res.writeHead(405, { allow: 'GET' });
      res.end(JSON.stringify({ error: 'method not allowed' }));
    } else if (req.url === '/broken') {
      throw new Error('storage is not ready');
    } else {
      res.end(JSON.stringify({ error: 'not found' }));
    }
  } catch (error) {
    console.error(`  [server] ${error.code ?? error.name}: ${error.message}`);
    if (res.headersSent) return res.end(); // too late to change the status: just finish
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'internal error' }));
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

try {
  let n = 0;
  for (const [method, path] of [['GET', '/records'], ['DELETE', '/records'], ['GET', '/nope'], ['GET', '/broken']]) {
    n += 1;
    const response = await fetch(base + path, {
      method,
      headers: { 'X-Request-Id': `r-${n}` },
      signal: AbortSignal.timeout(1500),
    });
    const allow = response.headers.get('allow');
    console.log(`${method} ${path} → ${response.status}, ok: ${response.ok}${allow ? `, Allow: ${allow}` : ''}`);
    console.log(`  ${await response.text()}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
