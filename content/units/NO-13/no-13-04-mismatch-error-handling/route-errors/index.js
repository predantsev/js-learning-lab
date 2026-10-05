// A rendering route, a request that breaks the render, and a request after it.
import http from 'node:http';
import { createElement as h, renderToString } from './mini-react.js';
import { HabitList } from './HabitList.js';

const CATCH_ERRORS = false;

// The second request reads a habit that a damaged import saved without its completions.
const stores = {
  '/': [{ id: 'h-01', name: '%%exercise%%', completions: ['2026-02-28', '2026-03-01'] }],
  '/broken': [{ id: 'h-02', name: '%%reading%%', completions: null }],
};

function render(req, res) {
  const markup = renderToString(h(HabitList, { habits: stores[req.url] ?? [] }));
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><div id="root">${markup}</div>`);
}

const server = http.createServer((req, res) => {
  if (!CATCH_ERRORS) {
    render(req, res);
    return;
  }
  try {
    render(req, res);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Internal error');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const path of ['/broken', '/']) {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(2000) });
    console.log(`GET ${path} → ${response.status} ${await response.text()}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
