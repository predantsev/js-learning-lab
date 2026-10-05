// Synthetic clients that speak raw HTTP over a TCP socket, so they can misbehave on purpose.
import net from 'node:net';

// Opens a socket, lets `write` send whatever it likes, and resolves when the server closes it:
// { status, ms } — the status line the server answered with (or null) and how long it took.
export function rawRequest(port, write) {
  return new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1');
    const started = Date.now();
    let answer = '';
    const safety = setTimeout(() => socket.destroy(), 5000); // never wait longer than 5 s
    socket.on('data', (data) => { answer += data; });
    socket.on('error', () => {}); // a reset after the answer is expected here
    socket.on('close', () => {
      clearTimeout(safety);
      resolve({ status: answer.split('\r\n')[0] || null, ms: Date.now() - started });
    });
    write(socket);
  });
}

// An upload of `totalBytes` with no Content-Length (chunked), 16 KB at a time, until the server answers.
export function chunkedUpload(socket, totalBytes) {
  socket.write('POST /expenses/import HTTP/1.1\r\nHost: lab\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n');
  const chunk = 'x'.repeat(16 * 1024);
  let sent = 0;
  const timer = setInterval(() => {
    if (socket.destroyed || sent >= totalBytes) return clearInterval(timer);
    socket.write(`${chunk.length.toString(16)}\r\n${chunk}\r\n`);
    sent += chunk.length;
  }, 5);
  socket.on('close', () => clearInterval(timer));
}

// A client that sends its request line and headers one character every 100 ms.
export function slowHeaders(socket) {
  const text = 'GET /expenses HTTP/1.1\r\nHost: lab\r\n\r\n';
  let index = 0;
  const timer = setInterval(() => {
    if (socket.destroyed || index >= text.length) return clearInterval(timer);
    socket.write(text[index]);
    index += 1;
  }, 100);
  socket.on('close', () => clearInterval(timer));
}
