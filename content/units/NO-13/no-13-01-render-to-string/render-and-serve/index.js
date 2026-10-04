// Renders the list to an HTML string, then serves the same string from a node:http route.
import http from 'node:http';
import { createElement as h, renderToString } from './mini-react.js';
import { TaskList } from './TaskList.js';
import { tasks } from './tasks.js';

const markup = renderToString(h(TaskList, { tasks }));
console.log(markup);

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    const html = renderToString(h(TaskList, { tasks }));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('not found');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/`, { signal: AbortSignal.timeout(2000) });
  const body = await response.text();
  console.log(`GET / → ${response.status} ${response.headers.get('content-type')}`);
  console.log(`%%sameString%% ${body === markup}`);
} finally {
  server.closeAllConnections();
  server.close();
}
