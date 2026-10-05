// The club's API on node:http.
//   GET  /summary → 200 [{ id, name, pagesRead, votes }]
//   POST /reads   { memberId, bookId, pages } → 201 the stored reading
// Errors: { error: { code } } — 400 VALIDATION_FAILED or MALFORMED_JSON, 404 NOT_FOUND.
import http from 'node:http';

const json = (response, status, value) => {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
};

async function readJson(request) {
  let text = '';
  for await (const chunk of request) {
    text += chunk;
    if (text.length > 2048) throw Object.assign(new Error('too large'), { status: 413, code: 'PAYLOAD_TOO_LARGE' });
  }
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error('malformed'), { status: 400, code: 'MALFORMED_JSON' });
  }
}

export function createApp(club) {
  return http.createServer(async (request, response) => {
    try {
      if (request.method === 'GET' && request.url === '/summary') return json(response, 200, club.summary());
      if (request.method === 'POST' && request.url === '/reads') {
        const body = await readJson(request);
        const { memberId, bookId, pages } = body ?? {};
        if (typeof memberId !== 'string' || typeof bookId !== 'string') {
          return json(response, 400, { error: { code: 'VALIDATION_FAILED' } });
        }
        if (!club.hasMember(memberId) || !club.hasBook(bookId)) return json(response, 404, { error: { code: 'NOT_FOUND' } });
        club.addRead({ memberId, bookId, pages });
        return json(response, 201, { memberId, bookId, pages });
      }
      json(response, 404, { error: { code: 'NOT_FOUND' } });
    } catch (error) {
      json(response, error.status ?? 500, { error: { code: error.code ?? 'INTERNAL' } });
    }
  });
}
