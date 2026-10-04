import { repository } from './repository.js';

// Send `value` as a complete JSON answer with the given status.
export function sendJson(res, status, value) {
  const text = JSON.stringify(value);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('content-length', Buffer.byteLength(text));
  res.write(text);
}

export function handle(req, res) {
  try {
    if (req.url === '/records') {
      if (req.method === 'GET') return sendJson(res, 200, repository.list());
      res.setHeader('allow', 'GET');
      return sendJson(res, 405, { error: 'method not allowed' });
    }
    return sendJson(res, 404, { error: 'not found' });
  } catch (error) {
    console.error(error.message);
    return sendJson(res, 500, { error: 'internal error' });
  }
}
