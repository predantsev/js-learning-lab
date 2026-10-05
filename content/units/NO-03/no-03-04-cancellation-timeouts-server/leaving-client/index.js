// An expense server and three troublesome clients: one that leaves early, one that never finishes
// sending its request, and one that waits for a slow handler.
import http from 'node:http';
import net from 'node:net';

const PASS_SIGNAL = false; // step 1 of "Try it": set to true
const t0 = performance.now();
const log = (text) => console.log(`${String(Math.round(performance.now() - t0)).padStart(5)} ms  ${text}`);

// Stands in for a slow repository call (800 ms). It stops early when `signal` is aborted.
function slowTotal(signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(84550 + 52000), 800);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}

const server = http.createServer({ requestTimeout: 1000, connectionsCheckingInterval: 100 }, async (req, res) => {
  if (req.url === '/slow-report') {
    await new Promise((resolve) => setTimeout(resolve, 1200)); // a slow handler, no signal
    return res.end('%%reportReady%%');
  }
  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) {
      log('[server] %%clientLeft%%');
      controller.abort();
    }
  });
  try {
    const total = await slowTotal(PASS_SIGNAL ? controller.signal : undefined);
    log(`[server] %%workFinished%% ${total}`);
    res.end(JSON.stringify({ totalMinor: total }));
  } catch (error) {
    log(`[server] %%workStopped%% ${error.name}`);
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

try {
  // 1. A client that gives up after 200 ms.
  try {
    await fetch(`${base}/total`, { signal: AbortSignal.timeout(200) });
  } catch (error) {
    log(`[client 1] %%gaveUp%% ${error.name}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 900)); // let the server's work run out

  // 2. A client that sends only part of its headers and then goes quiet.
  const reply = await new Promise((resolve) => {
    const socket = net.connect(server.address().port, '127.0.0.1', () => socket.write('GET /total HTTP/1.1\r\nHost: 127.0.0.1\r\n'));
    let data = '';
    socket.on('data', (chunk) => (data += chunk));
    socket.on('close', () => resolve(data.split('\r\n')[0] || '%%closedSilently%%'));
    setTimeout(() => { socket.destroy(); resolve('%%noAnswer%%'); }, 2000); // our own guard
  });
  log(`[client 2] ${reply}`);

  // 3. A client of a handler that takes 1.2 s, longer than requestTimeout.
  const response = await fetch(`${base}/slow-report`, { signal: AbortSignal.timeout(3000) });
  log(`[client 3] ${response.status} ${await response.text()}`);
} finally {
  server.closeAllConnections();
  server.close();
}
