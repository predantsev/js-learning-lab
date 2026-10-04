// The GET / route and the client's report of recoverable hydration errors.
import { randomUUID } from 'node:crypto';
import { renderPage, fallbackPage } from './pages.js';

// Returns a node:http handler. loadTasks() gives the records; log(entry) writes one log entry.
export function createRenderRoute({ loadTasks, log }) {
  return function renderRoute(req, res) {
    const incoming = req.headers['x-request-id'];
    const requestId = typeof incoming === 'string' && incoming !== '' ? incoming : randomUUID();
    const html = renderPage(loadTasks());
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-request-id': requestId });
    res.end(html);
  };
}

// Returns the onRecoverableError option for hydrateRoot.
export function reportRecoverable(log, requestId) {
  return (error, errorInfo) => {
    log({ level: 'warn', kind: 'hydration', requestId, message: error.message, componentStack: errorInfo.componentStack });
  };
}
