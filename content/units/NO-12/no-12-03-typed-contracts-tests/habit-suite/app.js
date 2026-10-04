// The habit service: GET /habits answers a summary of every habit.
import http from 'node:http';

const habits = [
  { id: 'h-01', name: '%%exercise%%', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: '%%reading%%', active: true, completions: ['2026-02-26', '2026-02-28'] },
  { id: 'h-03', name: '%%water%%', active: false, completions: [] },
];

export function createApp() {
  return http.createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/habits') {
      const summaries = habits.map((habit) => ({
        id: habit.id,
        name: habit.name,
        active: habit.active,
        completionCount: habit.completions.length,
      }));
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(summaries));
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'not found' }));
  });
}
