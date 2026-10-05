import net from 'node:net';
import { createApp } from './server.js';

const LIMIT = 256;
const post = async (body) => request(`${await listen(createApp({ maxBytes: LIMIT }))}/records`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body,
  signal: AbortSignal.timeout(1000),
});

// Sends a request by hand over a raw TCP connection: the head, then each body part after `gapMs`.
// Resolves with the status line and the body of the answer, or 'no answer' after `waitMs`.
async function rawPost(head, parts, { gapMs = 40, waitMs = 1000 } = {}) {
  const base = await listen(createApp({ maxBytes: LIMIT }));
  const { port } = new URL(base);
  return new Promise((resolve) => {
    let data = Buffer.alloc(0);
    const socket = net.connect(Number(port), '127.0.0.1');
    const finish = () => {
      clearTimeout(timer);
      socket.destroy();
      const text = data.toString('utf8');
      resolve({ statusLine: text.split('\r\n')[0] || 'no answer', body: text.split('\r\n\r\n')[1] ?? '' });
    };
    const timer = setTimeout(finish, waitMs);
    socket.on('data', (chunk) => {
      data = Buffer.concat([data, chunk]);
      const text = data.toString('utf8');
      const length = /content-length: (\d+)/i.exec(text)?.[1];
      const bodyStart = text.indexOf('\r\n\r\n');
      if (length !== undefined && bodyStart !== -1 && data.length - Buffer.byteLength(text.slice(0, bodyStart + 4)) >= Number(length)) finish();
    });
    socket.on('close', finish);
    socket.on('error', () => {});
    socket.on('connect', async () => {
      socket.write(head);
      for (const part of parts) {
        await new Promise((r) => setTimeout(r, gapMs));
        if (!socket.destroyed) socket.write(part);
      }
    });
  });
}

test('returns the parsed value of a JSON body', async () => {
  const value = { name: L.habit, frequency: 'daily', active: true };
  const response = await post(JSON.stringify(value));
  expect(response.status, 'status of POST /records with a small valid body').toBe(201);
  expect(response.json?.received, 'value the server got from readJsonBody').toEqual(value);
});

test('answers 413 for a body over the limit', async () => {
  const response = await post(JSON.stringify({ name: L.habit, note: 'x'.repeat(8 * 1024) }));
  expect(response.status, `status of an 8 KB body with a ${LIMIT}-byte limit`).toBe(413);
});

test('answers 413 without waiting for the rest of the body', async () => {
  // The client announces 1,000,000 bytes, sends 2 KB and then keeps the connection open.
  const head = 'POST /records HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\nContent-Length: 1000000\r\n\r\n';
  const reply = await rawPost(head, ['{"note": "' + 'x'.repeat(2048)]);
  expect(reply.statusLine, 'answer within 1 s to a body that is still arriving').toMatch(/^HTTP\/1\.1 413/);
});

test('counts the limit in bytes, not characters', async () => {
  const body = JSON.stringify({ name: 'ї'.repeat(200) }); // 211 characters, 411 bytes
  const response = await post(body);
  expect(response.status, `status of a body of ${body.length} characters and ${Buffer.byteLength(body)} bytes`).toBe(413);
});

test('accepts a body of exactly the limit', async () => {
  const filler = 'x'.repeat(LIMIT - JSON.stringify({ note: '' }).length);
  const body = JSON.stringify({ note: filler }); // exactly 256 bytes
  const response = await post(body);
  expect(response.status, `status of a body of exactly ${Buffer.byteLength(body)} bytes`).toBe(201);
});

test('answers 400 for malformed JSON', async () => {
  const response = await post('{"name": "' + L.habit);
  expect(response.status, 'status of a cut-off JSON body').toBe(400);
});

test('keeps a character that arrives split between two chunks', async () => {
  // "ї" is two bytes in UTF-8: the first one arrives in one chunk, the second 40 ms later.
  const bytes = Buffer.from('{"name":"ї"}', 'utf8');
  const cut = bytes.indexOf(Buffer.from('ї', 'utf8')) + 1;
  const head = `POST /records HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\nContent-Length: ${bytes.length}\r\nConnection: close\r\n\r\n`;
  const reply = await rawPost(head, [bytes.subarray(0, cut), bytes.subarray(cut)]);
  expect(reply.statusLine, 'status line of the split request').toMatch(/^HTTP\/1\.1 201/);
  let received;
  try {
    received = JSON.parse(reply.body).received;
  } catch {
    received = reply.body;
  }
  expect(received, 'value decoded from the two chunks').toEqual({ name: 'ї' });
});
