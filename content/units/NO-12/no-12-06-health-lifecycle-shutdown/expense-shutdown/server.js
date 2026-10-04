// The expense service: GET /expenses and PATCH /expenses/<id>.
import http from 'node:http';

export function createServer(store, log) {
  const server = http.createServer(async (request, response) => {
    const send = (status, body) => {
      // After server.close() the server no longer listens: tell the client to drop this keep-alive
      // connection, or close() waits until the idle connection times out.
      const headers = { 'content-type': 'application/json' };
      if (!server.listening) headers.connection = 'close';
      response.writeHead(status, headers);
      response.end(JSON.stringify(body));
    };
    const match = /^\/expenses\/([\w-]+)$/.exec(request.url);
    if (request.method === 'PATCH' && match) {
      let body = '';
      for await (const chunk of request) body += chunk;
      const expense = await store.update(match[1], JSON.parse(body));
      log(`PATCH ${request.url} → 200`);
      send(200, expense);
      return;
    }
    send(200, store.list());
  });
  return server;
}
