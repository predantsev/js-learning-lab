import http from 'node:http';
import { once } from 'node:events';

function sendJson(res, status, value) {
  const text = JSON.stringify(value);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text) });
  res.end(text);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4096) throw Object.assign(new Error('body too large'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('malformed JSON'), { status: 400 });
  }
}

// Returns the name of the first invalid field, or null when the expense is valid.
function invalidField(input) {
  if (typeof input?.label !== 'string' || input.label.trim() === '') return 'label';
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) return 'amountMinor';
  return null;
}

export function createApp(repository) {
  return http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      const item = /^\/records\/([^/]+)$/.exec(pathname);

      if (pathname === '/records') {
        if (req.method === 'GET') return sendJson(res, 200, repository.expenses);
        if (req.method === 'POST') {
          const input = await readJson(req);
          const field = invalidField(input);
          if (field) return sendJson(res, 400, { error: 'invalid expense', field });
          const expense = { id: `e-${String(repository.expenses.length + 1).padStart(2, '0')}`, ...input };
          repository.expenses.push(expense);
          return sendJson(res, 201, expense);
        }
        res.setHeader('allow', 'GET, POST');
        return sendJson(res, 405, { error: 'method not allowed' });
      }
      if (item && req.method === 'GET') {
        const expense = repository.expenses.find((e) => e.id === decodeURIComponent(item[1]));
        if (!expense) return sendJson(res, 404, { error: 'expense not found' });
        return sendJson(res, 200, expense);
      }
      if (pathname === '/totals' && req.method === 'GET') {
        if (!repository.loaded) await once(repository, 'loaded'); // the event may have fired already
        const totalMinor = repository.expenses.reduce((sum, e) => sum + e.amountMinor, 0);
        return sendJson(res, 200, { count: repository.expenses.length, totalMinor });
      }
      sendJson(res, 404, { error: 'not found' });
    } catch (error) {
      if (res.headersSent) return res.end();
      sendJson(res, error.status ?? 500, { error: error.status ? error.message : 'internal error' });
    }
  });
}
