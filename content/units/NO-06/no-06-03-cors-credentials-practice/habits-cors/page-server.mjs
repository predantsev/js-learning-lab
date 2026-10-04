// Serves page/index.html — a stand-in for your React dev server: another origin than the API.
// Started with `node page-server.mjs` it listens on 127.0.0.1:5173 (PORT can change that).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function createPageServer() {
  return http.createServer(async (request, response) => {
    // The browser asks for an icon on its own; "no content" keeps a red 404 line out of the console.
    if (request.url === '/favicon.ico') {
      response.writeHead(204);
      return response.end();
    }
    if (request.method !== 'GET' || (request.url !== '/' && request.url !== '/index.html')) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      return response.end('not found');
    }
    const html = await readFile(new URL('./page/index.html', import.meta.url), 'utf8');
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    response.end(html);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 5173);
  const server = createPageServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`%%pageOn%% http://127.0.0.1:${port}`);
    console.log('%%stopHint%%');
  });
  process.on('SIGINT', () => server.close(() => console.log('%%pageClosed%%')));
}
