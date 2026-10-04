// The expense server with health checks and a graceful shutdown.
// This version counts the requests in flight itself instead of waiting for server.close().
import http from 'node:http';
import { once } from 'node:events';

export async function startServer({ port, host, store, deadlineMs = 5000 }, { exit = (code) => process.exit(code), log = console.log } = {}) {
  let state = 'running';
  let inFlight = 0;
  const idle = new EventTarget();

  const server = http.createServer(async (request, response) => {
    inFlight += 1;
    response.on('close', () => {
      inFlight -= 1;
      if (inFlight === 0) idle.dispatchEvent(new Event('idle'));
    });
    const reply = (status, value) => {
      response.setHeader('content-type', 'application/json');
      if (state !== 'running') response.setHeader('connection', 'close');
      response.statusCode = status;
      response.end(JSON.stringify(value));
    };
    const { pathname } = new URL(request.url, 'http://localhost');
    if (pathname === '/livez') return reply(200, { status: 'alive' });
    if (pathname === '/readyz') return reply(state === 'running' && store.isReady() ? 200 : 503, { status: state });
    if (pathname === '/expenses' && request.method === 'GET') return reply(200, store.list());
    const id = pathname.startsWith('/expenses/') ? pathname.slice('/expenses/'.length) : null;
    if (id && request.method === 'PATCH') {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      return reply(200, await store.update(id, JSON.parse(Buffer.concat(chunks).toString('utf8'))));
    }
    return reply(404, { error: 'not found' });
  });

  const onSignal = async (signal) => {
    if (state !== 'running') return;
    state = 'draining';
    for (const name of ['SIGTERM', 'SIGINT']) process.removeListener(name, onSignal);
    log(`${signal} received, draining ${inFlight} request(s)`);
    server.close();
    server.closeIdleConnections();
    const drained = inFlight === 0 || (await Promise.race([
      once(idle, 'idle').then(() => true),
      new Promise((resolve) => setTimeout(resolve, deadlineMs, false).unref()),
    ]));
    if (!drained) {
      server.closeAllConnections();
      log('forced exit');
      return exit(1);
    }
    await store.flush();
    exit(0);
  };
  for (const name of ['SIGTERM', 'SIGINT']) process.on(name, onSignal);

  server.listen(port, host);
  await once(server, 'listening');
  return { url: `http://${host}:${server.address().port}` };
}
