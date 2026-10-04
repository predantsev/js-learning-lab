import { repository } from './repository.js';

// Send `value` as a complete JSON answer with the given status.
export function sendJson(res, status, value) {
  // TODO: the status, Content-Type and Content-Length (in bytes) before the body
  res.end(JSON.stringify(value));
}

export function handle(req, res) {
  try {
    if (req.url === '/records') {
      if (req.method === 'GET') return sendJson(res, 200, repository.list());
      // TODO: any other method on /records: 405 with an Allow header
      return sendJson(res, 200, { error: 'method not allowed' });
    }
    // TODO: an unknown address: 404
    return sendJson(res, 200, { error: 'not found' });
  } catch (error) {
    console.error(error.message);
    // TODO: an unexpected failure: 500
    return sendJson(res, 200, { error: 'internal error' });
  }
}
