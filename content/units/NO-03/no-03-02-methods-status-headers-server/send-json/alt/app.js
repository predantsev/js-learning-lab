import { repository } from './repository.js';

// Send `value` as a complete JSON answer with the given status.
export function sendJson(res, status, value) {
  const body = Buffer.from(JSON.stringify(value), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': body.length,
  });
  res.end(body);
}

export function handle(req, res) {
  try {
    if (req.url !== '/records') return sendJson(res, 404, { error: 'not found' });
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return sendJson(res, 405, { error: 'method not allowed' });
    }
    return sendJson(res, 200, repository.list());
  } catch (error) {
    console.error(error.message);
    return sendJson(res, 500, { error: 'internal error' });
  }
}
