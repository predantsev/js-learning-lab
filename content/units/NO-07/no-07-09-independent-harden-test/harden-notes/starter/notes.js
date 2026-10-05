// The notes API behind the edge (read-only). It checks the session token itself: only a request
// with "Authorization: Bearer demo-notes-token" may read or write notes.
const TOKEN = 'demo-notes-token'; // synthetic, for this exercise only

export function createNotesHandler() {
  const notes = [{ id: 'n-01', text: '%%note1%%' }];
  return async function handleNotes(request, response, { body, requestId }) {
    const send = (status, value) => {
      response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(value));
    };
    if (request.headers.authorization !== `Bearer ${TOKEN}`) return send(401, { error: { code: 'UNAUTHENTICATED', requestId } });
    const route = new URL(request.url, 'http://localhost').pathname;
    if (route === '/notes' && request.method === 'GET') return send(200, notes);
    if (route === '/notes' && request.method === 'POST') {
      if (typeof body?.text !== 'string' || body.text.trim() === '') return send(400, { error: { code: 'VALIDATION_FAILED', requestId } });
      const note = { id: `n-${String(notes.length + 1).padStart(2, '0')}`, text: body.text.trim() };
      notes.push(note);
      return send(201, note);
    }
    send(404, { error: { code: 'NOT_FOUND', requestId } });
  };
}
