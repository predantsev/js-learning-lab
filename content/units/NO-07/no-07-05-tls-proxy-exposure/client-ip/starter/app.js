// A tiny server that answers with the client address it decided on (read-only).
import http from 'node:http';
import { clientIp } from './client-ip.js';

export function createApp({ trustedProxies }) {
  return http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ client: clientIp(request, { trustedProxies }) }));
  });
}
