import http from 'node:http';
import { startServer } from './app.js';

async function started(config) {
  const server = await startServer(config);
  expect(server?.listening, 'server.listening after startServer resolved').toBe(true);
  return server;
}

async function stop(server) {
  if (!server?.listening) return;
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

// A port that was free a moment ago on 127.0.0.1, chosen below the ranges the operating system
// hands out for port 0, so listen(0, …) can never land on it by chance.
async function freePort() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const port = 21000 + Math.floor(Math.random() * 8000);
    const probe = http.createServer();
    const ok = await new Promise((resolve) => {
      probe.once('error', () => resolve(false));
      probe.listen(port, '127.0.0.1', () => resolve(true));
    });
    if (ok) {
      await new Promise((resolve) => probe.close(resolve));
      return port;
    }
  }
  throw new Error('no free port found between 21000 and 29000');
}

test('answers with its method and URL as plain text', async () => {
  const server = await started({ host: '127.0.0.1', port: 0 });
  try {
    const base = await listen(server);
    const get = await request(`${base}/records?sort=name`, { signal: AbortSignal.timeout(1000) });
    expect(get.status, 'status of GET /records?sort=name').toBe(200);
    expect(get.text, 'body of GET /records?sort=name').toBe('GET /records?sort=name');
    const post = await request(`${base}/habits/h-02`, { method: 'POST', signal: AbortSignal.timeout(1000) });
    expect(post.text, 'body of POST /habits/h-02').toBe('POST /habits/h-02');
  } finally {
    await stop(server);
  }
});

test('says the answer is plain text', async () => {
  const server = await started({ host: '127.0.0.1', port: 0 });
  try {
    const base = await listen(server);
    // fetch resolves as soon as the status line and the headers arrive.
    const response = await fetch(`${base}/records`, { signal: AbortSignal.timeout(1000) });
    expect(response.headers.get('content-type') ?? '(no Content-Type)', 'Content-Type of GET /records').toMatch(/^text\/plain/);
    await response.body?.cancel();
  } finally {
    await stop(server);
  }
});

test('listens on the port and the host from config', async () => {
  const port = await freePort();
  const server = await started({ host: '127.0.0.1', port });
  try {
    const address = server.address();
    expect(address.port, `port of the server started with config.port = ${port}`).toBe(port);
    expect(address.address, 'address the server listens on').toBe('127.0.0.1');
  } finally {
    await stop(server);
  }
});
