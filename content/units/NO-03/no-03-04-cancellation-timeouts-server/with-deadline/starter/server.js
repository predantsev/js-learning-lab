// Read-only: GET /total runs the repository call through your withDeadline.
import http from 'node:http';
import { withDeadline } from './deadline.js';

function sendJson(res, status, value) {
  const text = JSON.stringify(value);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text) });
  res.end(text);
}

export function createApp({ deadlineMs, repository, log = () => {} }) {
  return http.createServer(async (req, res) => {
    const clientGone = new AbortController();
    res.on('close', () => {
      if (!res.writableFinished) clientGone.abort();
    });
    try {
      const totalMinor = await withDeadline(deadlineMs, clientGone.signal, (signal) => repository.total(signal));
      sendJson(res, 200, { totalMinor });
    } catch (error) {
      if (clientGone.signal.aborted) {
        log(`[server] client left, work stopped (${error.name})`);
        return; // nobody is waiting for an answer
      }
      if (error.name === 'TimeoutError') return sendJson(res, 503, { error: 'deadline exceeded' });
      log(`[server] ${error.name}: ${error.message}`);
      sendJson(res, 500, { error: 'internal error' });
    }
  });
}
