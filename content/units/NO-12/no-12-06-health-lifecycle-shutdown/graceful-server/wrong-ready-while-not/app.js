// The expense server with health checks and a graceful shutdown.
import http from 'node:http';

export async function startServer({ port, host, store, deadlineMs = 5000 }, { exit = (code) => process.exit(code), log = console.log } = {}) {
  let shuttingDown = false;

  const server = http.createServer(async (request, response) => {
    const send = (status, body) => {
      const headers = { 'content-type': 'application/json' };
      if (shuttingDown) headers.connection = 'close'; // let close() finish without waiting for keep-alive
      response.writeHead(status, headers);
      response.end(JSON.stringify(body));
    };
    if (request.url === '/livez') return send(200, { status: 'alive' });
    if (request.url === '/readyz') {
      return !shuttingDown ? send(200, { status: 'ready' }) : send(503, { status: 'not ready' });
    }
    if (request.method === 'GET' && request.url === '/expenses') return send(200, store.list());
    const match = /^\/expenses\/([\w-]+)$/.exec(request.url);
    if (request.method === 'PATCH' && match) {
      let body = '';
      for await (const chunk of request) body += chunk;
      return send(200, await store.update(match[1], JSON.parse(body)));
    }
    return send(404, { error: 'not found' });
  });

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    process.off('SIGTERM', shutdown);
    process.off('SIGINT', shutdown);
    log(`${signal}: no new connections, waiting up to ${deadlineMs} ms for requests in flight`);

    const closed = new Promise((resolve) => server.close(() => resolve('closed')));
    server.closeIdleConnections();
    let timer;
    const deadline = new Promise((resolve) => { timer = setTimeout(resolve, deadlineMs, 'deadline'); });
    const outcome = await Promise.race([closed, deadline]);
    clearTimeout(timer);

    if (outcome === 'deadline') {
      server.closeAllConnections();
      log('deadline passed: requests in flight were cut off');
      exit(1);
      return;
    }
    await store.flush();
    log('drained and flushed');
    exit(0);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  await new Promise((resolve) => server.listen(port, host, resolve));
  return { url: `http://${host}:${server.address().port}` };
}
