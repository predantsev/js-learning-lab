// The planner API's own handler (read-only). It knows nothing about CORS and answers OPTIONS with 405.
export function plannerHandler(request, response) {
  const send = (status, value) => {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
  };
  if (request.url !== '/v1/records') return send(404, { error: { code: 'NOT_FOUND' } });
  if (request.method === 'GET') {
    return send(200, [{ id: 't-02', title: '%%library%%', dueDate: '2026-03-01', done: false, priority: 'high' }]);
  }
  send(405, { error: { code: 'METHOD_NOT_ALLOWED' } });
}
