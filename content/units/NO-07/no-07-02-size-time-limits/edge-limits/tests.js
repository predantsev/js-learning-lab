// The edge over real sockets: honest, oversized and slow clients.
import net from 'node:net';
import { createLimitedServer } from './limits.js';

const LIMITS = { maxBodyBytes: 1024, headersTimeoutMs: 300, requestTimeoutMs: 800 };

// A handler that records every body it receives and answers 201.
function recordingHandler() {
  const bodies = [];
  const handler = async (request, response, body) => {
    bodies.push(body);
    response.writeHead(201, { 'content-type': 'application/json' });
    response.end('{"ok":true}');
  };
  return { handler, bodies };
}

// Some checks use a much longer requestTimeout, so that only the rule they test can answer in time.
async function start(limits = LIMITS) {
  expect(typeof createLimitedServer, 'type of createLimitedServer').toBe('function');
  const recorded = recordingHandler();
  const base = await listen(createLimitedServer(recorded.handler, limits));
  return { ...recorded, port: Number(new URL(base).port) };
}

// Opens a socket, lets `write` misbehave, and resolves when the server closes it or after waitMs:
// { status, statusMs, closedMs } (closedMs is null when the socket was still open at waitMs).
function raw(port, write, waitMs) {
  return new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1');
    const started = Date.now();
    const result = { status: null, statusMs: null, closedMs: null };
    let answer = '';
    const finish = () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(result);
    };
    const timer = setTimeout(finish, waitMs);
    socket.on('data', (data) => {
      answer += data;
      if (result.status === null && answer.includes('\r\n')) {
        result.status = Number(answer.split(' ')[1]);
        result.statusMs = Date.now() - started;
      }
    });
    socket.on('error', () => {});
    socket.on('close', () => {
      if (result.closedMs === null) result.closedMs = Date.now() - started;
      finish();
    });
    write(socket);
  });
}

const head = (lines) => `POST /habits/import HTTP/1.1\r\nHost: lab\r\nContent-Type: application/json\r\n${lines}\r\n`;
// Sends chunks of 512 bytes every 10 ms, without Content-Length, until the socket closes or 8 KB are sent.
function chunked(socket) {
  socket.write(head('Transfer-Encoding: chunked\r\n'));
  let sent = 0;
  const timer = setInterval(() => {
    if (socket.destroyed || sent >= 8192) return clearInterval(timer);
    socket.write(`200\r\n${'x'.repeat(512)}\r\n`);
    sent += 512;
  }, 10);
}

test('a body within the limit reaches the handler', async () => {
  const { port, bodies } = await start();
  const body = JSON.stringify([{ name: L.walk, frequency: 'daily' }]);
  const result = await raw(port, (socket) => socket.write(head(`Content-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n`) + body), 1000);
  expect(result.status, 'status for a small body').toBe(201);
  expect(bodies, 'bodies the handler received').toEqual([[{ name: L.walk, frequency: 'daily' }]]);
});

test('a declared Content-Length over the limit answers 413 before any body is sent', async () => {
  const { port, bodies } = await start();
  // No body is ever sent: a server that waits for it can only answer 408 (requestTimeout, 800 ms).
  const result = await raw(port, (socket) => socket.write(head('Content-Length: 1000000\r\n')), 1000);
  expect(result.status, 'status for Content-Length: 1000000 with no body sent').toBe(413);
  expect(bodies.length, 'handler calls').toBe(0);
});

test('a body over the limit without Content-Length answers 413', async () => {
  const { port, bodies } = await start();
  const result = await raw(port, chunked, 1000);
  expect(result.status, 'status for 8 KB sent in chunks without Content-Length').toBe(413);
  expect(bodies.length, 'handler calls').toBe(0);
});

test('a 413 answer closes the connection at once', async () => {
  // requestTimeout is 5 s here: a connection closed within 2 s was closed by the 413 itself.
  const { port } = await start({ ...LIMITS, requestTimeoutMs: 5000 });
  const result = await raw(port, chunked, 2000);
  expect(result.status, 'status for 8 KB sent in chunks without Content-Length').toBe(413);
  expect(result.closedMs !== null, 'the server closed the connection within 2 s (requestTimeout is 5 s in this check)').toBe(true);
});

test('a client that sends its headers too slowly gets 408', async () => {
  // requestTimeout is 5 s here, so a 408 within 2 s can only come from headersTimeout (300 ms).
  const { port, bodies } = await start({ ...LIMITS, requestTimeoutMs: 5000 });
  const text = 'GET /habits HTTP/1.1\r\nHost: lab\r\n\r\n';
  const result = await raw(port, (socket) => {
    let index = 0;
    const timer = setInterval(() => {
      if (socket.destroyed || index >= text.length) return clearInterval(timer);
      socket.write(text[index]);
      index += 1;
    }, 100);
  }, 2000);
  expect(result.status, 'status within 2 s for headers at one character per 100 ms').toBe(408);
  expect(bodies.length, 'handler calls').toBe(0);
});

test('a client whose body never finishes gets 408', async () => {
  const { port } = await start();
  // Without requestTimeout Node.js waits 300 s by default, so a 408 within 2.5 s is the 800 ms limit.
  const result = await raw(port, (socket) => socket.write(`${head('Content-Length: 50\r\n')}[{"na`), 2500);
  expect(result.status, 'status within 2.5 s when 5 of 50 announced bytes arrive').toBe(408);
});
