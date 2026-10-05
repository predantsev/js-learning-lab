// The planner lab's API: GET /tasks and POST /tasks over the repository. It answers 201 only
// after the repository has saved the task, and logs one line for every request it answers.
import { randomUUID } from 'node:crypto';
import http from 'node:http';

async function readJson(request) {
  let text = '';
  for await (const chunk of request) text += chunk;
  return JSON.parse(text);
}

function send(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(value));
}

export function createServer(repo) {
  return http.createServer(async (request, response) => {
    const { method, url } = request;
    response.on('finish', () => console.log(`server: ${method} ${url} → ${response.statusCode}`));
    try {
      if (url === '/tasks' && method === 'GET') return send(response, 200, await repo.list());
      if (url === '/tasks' && method === 'POST') {
        const { title } = await readJson(request);
        if (typeof title !== 'string' || title.trim() === '' || title.length > 80) {
          return send(response, 400, { error: 'invalid title' });
        }
        const task = { id: `t-${randomUUID().slice(0, 8)}`, title: title.trim(), dueDate: null, done: false, priority: 'normal' };
        return send(response, 201, await repo.add(task));
      }
      send(response, 404, { error: 'not found' });
    } catch {
      send(response, 500, { error: 'internal error' });
    }
  });
}
