// What both releases share: the HTTP shell with request ids, error logs and counters.
import http from 'node:http';

export function serve(routes, { log, port = 0 }) {
  const counts = { requests: 0, errors: 0 };
  let lastId = 0;
  const server = http.createServer(async (request, response) => {
    const requestId = `r-${++lastId}`;
    const url = new URL(request.url, 'http://127.0.0.1');
    counts.requests += 1;
    let status = 200;
    let body;
    try {
      if (url.pathname === '/metrics') body = { ...counts };
      else if (routes[url.pathname]) body = await routes[url.pathname](url);
      else [status, body] = [404, { error: 'not found' }];
    } catch (error) {
      counts.errors += 1;
      [status, body] = [500, { error: 'internal error', requestId }];
      log({ level: 'error', requestId, route: url.pathname, message: error.message });
    }
    response.writeHead(status, { 'content-type': 'application/json', 'x-request-id': requestId });
    response.end(JSON.stringify(body));
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}
