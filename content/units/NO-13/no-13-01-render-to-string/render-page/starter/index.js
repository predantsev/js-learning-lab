// Driver (read-only): serves renderPage(habits) at GET / on a free loopback port, fetches it once
// and prints the document.
import http from 'node:http';
import { renderPage } from './page.js';
import { habits } from './habits.js';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(renderPage(habits));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/`, { signal: AbortSignal.timeout(2000) });
  console.log(`GET / → ${response.status}`);
  console.log(await response.text());
} finally {
  server.closeAllConnections();
  server.close();
}
