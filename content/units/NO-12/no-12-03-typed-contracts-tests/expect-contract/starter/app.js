// A habit service with one contract break: GET /habits/summary sends completionCount as text.
import http from 'node:http';

const habits = [
  { id: 'h-01', name: '%%exercise%%', active: true, completionCount: 3 },
  { id: 'h-04', name: '%%tidy%%', active: true, completionCount: 2 },
];

export function createApp() {
  return http.createServer((request, response) => {
    const send = (status, body) => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(body));
    };
    if (request.url === '/habits') return send(200, habits);
    if (request.url === '/habits/summary') return send(200, habits.map((h) => ({ ...h, completionCount: String(h.completionCount) })));
    if (request.url === '/habits/h-01') return send(200, habits[0]);
    return send(404, { error: 'not found' });
  });
}
