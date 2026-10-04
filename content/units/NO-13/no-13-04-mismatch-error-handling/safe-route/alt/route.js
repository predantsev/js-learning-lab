// The GET / route and the client's report of recoverable hydration errors.
import { randomUUID } from 'node:crypto';
import { renderPage, fallbackPage } from './pages.js';

function requestIdOf(req) {
  return req.headers['x-request-id'] || randomUUID();
}

function send(res, status, requestId, html) {
  res.statusCode = status;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('x-request-id', requestId);
  res.end(html);
}

// Returns a node:http handler. loadTasks() gives the records; log(entry) writes one log entry.
export function createRenderRoute({ loadTasks, log }) {
  return function renderRoute(req, res) {
    const requestId = requestIdOf(req);
    try {
      send(res, 200, requestId, renderPage(loadTasks()));
    } catch (error) {
      log({ level: 'error', requestId, message: String(error.message) });
      send(res, 500, requestId, fallbackPage(requestId));
    }
  };
}

// Returns the onRecoverableError option for hydrateRoot.
export function reportRecoverable(log, requestId) {
  return function onRecoverableError(error, { componentStack }) {
    log({ level: 'warn', kind: 'hydration', requestId, message: error.message, componentStack });
  };
}
