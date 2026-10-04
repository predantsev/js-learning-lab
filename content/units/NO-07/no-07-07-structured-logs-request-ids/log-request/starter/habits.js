// The habits API handler (read-only). /broken has a bug on purpose: it throws.
const habits = [{ id: 'h-01', name: '%%exercise%%' }, { id: 'h-06', name: '%%walk%%' }];

export async function handleHabits(request, response, { requestId }) {
  const send = (status, value) => {
    response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(value));
  };
  const route = new URL(request.url, 'http://localhost').pathname;
  if (route === '/habits') return send(200, habits);
  if (route === '/maintenance') return send(503, { error: { code: 'UNAVAILABLE', requestId } });
  if (route === '/broken') throw new TypeError("Cannot read properties of undefined (reading 'name')");
  send(404, { error: { code: 'NOT_FOUND', requestId } });
}
