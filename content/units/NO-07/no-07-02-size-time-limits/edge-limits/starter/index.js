// Starts the habits API behind your edge and sends three requests (read-only; Check sends the slow ones).
import net from 'node:net';
import { handleHabits } from './app.js';
import { createLimitedServer } from './limits.js';

const server = createLimitedServer(handleHabits, { maxBodyBytes: 1024, headersTimeoutMs: 300, requestTimeoutMs: 800 });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

// Sends raw HTTP text and prints the status line of the answer (or what happened instead).
function send(label, text) {
  return new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1', () => socket.write(text));
    const started = Date.now();
    let answer = '';
    const done = (status) => {
      clearTimeout(timer);
      socket.destroy();
      console.log(`${label} → ${status} (${Date.now() - started} ms)`);
      resolve();
    };
    const timer = setTimeout(() => done('%%noAnswer%%'), 1500);
    socket.on('data', (data) => {
      answer += data;
      if (answer.includes('\r\n')) done(answer.split('\r\n')[0]);
    });
    socket.on('error', () => {});
  });
}

try {
  const small = JSON.stringify([{ name: '%%walk%%', frequency: 'daily' }]);
  await send('POST /habits/import', `POST /habits/import HTTP/1.1\r\nHost: lab\r\nContent-Type: application/json\r\nContent-Length: ${Buffer.byteLength(small)}\r\n\r\n${small}`);
  await send('POST, Content-Length: 1000000', 'POST /habits/import HTTP/1.1\r\nHost: lab\r\nContent-Type: application/json\r\nContent-Length: 1000000\r\n\r\n');
  await send('GET /habits', 'GET /habits HTTP/1.1\r\nHost: lab\r\n\r\n');
} finally {
  server.closeAllConnections();
  server.close();
}
