// The habit service's GET /metrics route (read-only): it answers with metrics.render().
import http from 'node:http';

export function createApp(metrics) {
  return http.createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/metrics') {
      response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(metrics.render());
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'not found' }));
  });
}
