import http from 'node:http';

// Start a server that answers every request with its method and URL as plain text.
// It listens on config.port and config.host; the promise resolves with the server once it listens.
export function startServer(config) {
  const server = http.createServer((req, res) => {
    // TODO: status 200, a plain-text Content-Type and the text "<method> <url>"
  });
  // TODO: listen on the port and the host from config, then resolve with the server
  return Promise.resolve(server);
}
