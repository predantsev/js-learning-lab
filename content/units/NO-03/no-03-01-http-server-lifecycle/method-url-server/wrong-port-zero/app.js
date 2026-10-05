import http from 'node:http';

// Start a server that answers every request with its method and URL as plain text.
// It listens on config.port and config.host; the promise resolves with the server once it listens.
export function startServer(config) {
  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(`${req.method} ${req.url}`);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}
