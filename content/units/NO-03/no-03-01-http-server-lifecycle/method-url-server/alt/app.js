import http from 'node:http';
import { once } from 'node:events';

// Start a server that answers every request with its method and URL as plain text.
// It listens on config.port and config.host; the promise resolves with the server once it listens.
export async function startServer({ port, host }) {
  const server = http.createServer((req, res) => {
    const text = req.method + ' ' + req.url;
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(text);
  });
  server.listen(port, host);
  await once(server, 'listening');
  return server;
}
