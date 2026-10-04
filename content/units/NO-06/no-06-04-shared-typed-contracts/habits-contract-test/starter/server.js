// The habits API (read-only): GET /v1/records answers every habit in the shape of contract v1.
import http from 'node:http';

export function createServer() {
  const habits = [
    { id: 'h-01', name: '%%exercise%%', frequency: 'daily', active: true, completions: ['2026-02-28', '2026-03-01'] },
    { id: 'h-04', name: '%%tidy%%', frequency: 'weekly', active: true, completions: ['2026-03-01'] },
    { id: 'h-06', name: '%%walk%%', frequency: 'daily', active: true, completions: [] },
  ];
  return http.createServer((request, response) => {
    const found = request.method === 'GET' && request.url === '/v1/records';
    response.writeHead(found ? 200 : 404, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(found ? habits : { error: { code: 'NOT_FOUND' } }));
  });
}
