// The expense server with health checks and a graceful shutdown.
import http from 'node:http';

export async function startServer({ port, host, store, deadlineMs = 5000 }, { exit = (code) => process.exit(code), log = console.log } = {}) {
  const server = http.createServer(async (request, response) => {
    // TODO: /livez, /readyz, GET /expenses, PATCH /expenses/<id>
    response.writeHead(404);
    response.end();
  });
  // TODO: SIGTERM and SIGINT start one graceful shutdown
  await new Promise((resolve) => server.listen(port, host, resolve));
  return { url: `http://${host}:${server.address().port}` };
}
