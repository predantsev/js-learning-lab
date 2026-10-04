// A wishlist server that reports who it thinks is calling. Where it listens is configurable.
import http from 'node:http';

const LOOPBACK = ['127.0.0.1', '::1', 'localhost'];

// The host to listen on: HOST from the environment, loopback by default, with a warning otherwise.
export function bindHost(env) {
  const host = env.HOST ?? '127.0.0.1';
  if (!LOOPBACK.includes(host)) {
    console.warn(`[server] %%warning%% ${host}`);
  }
  return host;
}

export function createServer() {
  return http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({
      socketAddress: request.socket.remoteAddress, // who really opened the connection
      forwardedFor: request.headers['x-forwarded-for'] ?? null, // what the client wrote in a header
    }));
  });
}
