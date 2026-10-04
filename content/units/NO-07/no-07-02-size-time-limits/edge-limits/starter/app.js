// The habits API behind the edge (read-only). It only ever sees bodies that passed the limits.
const habits = [
  { id: 'h-01', name: '%%exercise%%', frequency: 'daily' },
  { id: 'h-04', name: '%%tidy%%', frequency: 'weekly' },
];

export async function handleHabits(request, response, body) {
  const send = (status, value) => {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
  };
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/habits' && request.method === 'GET') return send(200, habits);
  if (path === '/habits/import' && request.method === 'POST') return send(201, { imported: Array.isArray(body) ? body.length : 0 });
  send(404, { error: { code: 'NOT_FOUND' } });
}
