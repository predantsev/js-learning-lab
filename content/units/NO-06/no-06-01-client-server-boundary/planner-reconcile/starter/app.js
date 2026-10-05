// The planner API as it is now (read-only): GET /v1/records answers today's list of tasks.
import http from 'node:http';

export function createApp() {
  const tasks = [
    { id: 't-01', title: '%%plants%%', dueDate: '2026-03-02', done: true, priority: 'normal' },
    { id: 't-02', title: '%%library%%', dueDate: null, done: false, priority: 'high' },
    { id: 't-03', title: '%%grandma%%', dueDate: null, done: false, priority: 'low' },
    { id: 't-07', title: '%%bike%%', dueDate: '2026-03-06', done: false, priority: 'normal' },
  ];
  return http.createServer((request, response) => {
    const found = request.method === 'GET' && request.url === '/v1/records';
    response.writeHead(found ? 200 : 404, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(found ? tasks : { error: { code: 'NOT_FOUND' } }));
  });
}
