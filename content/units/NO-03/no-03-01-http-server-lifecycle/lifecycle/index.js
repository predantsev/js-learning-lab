// A real HTTP server on this computer: start it, send it one request, stop it.
import http from 'node:http';

const server = http.createServer((req, res) => {
  // Runs once for every request: req describes what arrived, res is the answer being built.
  console.log(`%%serverGot%% ${req.method} ${req.url}`);
  res.statusCode = 200;
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.write('%%wish%%');
  // res.end();
});

// Port 0 asks the operating system for any free port; 127.0.0.1 keeps the server on this computer.
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
console.log(`%%listening%% http://127.0.0.1:${port}`);

try {
  // The client gives up after 1.5 s, so a response that never ends cannot hold the program forever.
  const response = await fetch(`http://127.0.0.1:${port}/wishes`, { signal: AbortSignal.timeout(1500) });
  console.log(`%%clientStatus%% ${response.status}`);
  console.log(`%%clientBody%% ${await response.text()}`);
} catch (error) {
  console.log(`%%clientGaveUp%% ${error.name}`);
} finally {
  server.closeAllConnections(); // drop connections that are still open
  server.close(() => console.log('%%closed%%'));
}
