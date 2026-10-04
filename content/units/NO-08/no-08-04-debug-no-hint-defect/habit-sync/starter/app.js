// The habits API: GET /habits and PATCH /habits/:id { name?, active? }. Answers are JSON; every
// request gets one log line once its answer is sent.
import http from 'node:http';

const send = (response, status, value) => {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(value));
};

// → the changes, or null when the body breaks the contract.
function checkChanges(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return null;
  const keys = Object.keys(body);
  if (keys.length === 0 || keys.some((key) => key !== 'name' && key !== 'active')) return null;
  if ('name' in body && (typeof body.name !== 'string' || body.name.trim() === '' || body.name.trim().length > 80)) return null;
  if ('active' in body && typeof body.active !== 'boolean') return null;
  return 'name' in body ? { ...body, name: body.name.trim() } : body;
}

export function createApp(repo, log = () => {}) {
  return http.createServer(async (request, response) => {
    response.on('finish', () => log(`${request.method} ${request.url} → ${response.statusCode}`));
    try {
      if (request.url === '/habits' && request.method === 'GET') return send(response, 200, repo.list());
      const match = /^\/habits\/([^/]+)$/.exec(request.url);
      if (match && request.method === 'PATCH') {
        let id;
        try {
          id = decodeURIComponent(match[1]);
        } catch {
          return send(response, 400, { error: 'bad id' });
        }
        let text = '';
        for await (const chunk of request) text += chunk;
        let body;
        try {
          body = JSON.parse(text);
        } catch {
          return send(response, 400, { error: 'malformed JSON' });
        }
        const changes = checkChanges(body);
        if (!changes) return send(response, 400, { error: 'invalid changes' });
        const habit = await repo.update(id, changes);
        return habit ? send(response, 200, habit) : send(response, 404, { error: 'not found' });
      }
      send(response, 404, { error: 'not found' });
    } catch {
      send(response, 500, { error: 'internal error' });
    }
  });
}
