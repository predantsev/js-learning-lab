// The notes API with two versions (read-only). /v1 keeps its shape; /v2 renamed title to heading.
import http from 'node:http';

export function createApp() {
  const notes = [
    { id: 'n-1', heading: '%%gifts%%', text: '%%giftsText%%', pinned: false },
    { id: 'n-2', heading: '%%shopping%%', text: '', pinned: true },
  ];
  // Each version has its own way of turning a stored note into a response.
  const toV1 = (note) => ({ id: note.id, title: note.heading, text: note.text, pinned: note.pinned });
  const toV2 = (note) => ({ id: note.id, heading: note.heading, text: note.text, pinned: note.pinned });

  return http.createServer((request, response) => {
    const [version, collection, id] = request.url.split('/').filter((part) => part !== '');
    const note = notes.find((item) => item.id === id);
    const shape = { v1: toV1, v2: toV2 }[version];
    response.setHeader('content-type', 'application/json; charset=utf-8');
    if (collection !== 'notes' || !shape || !note) {
      response.statusCode = 404;
      return response.end(JSON.stringify({ error: { code: 'NOT_FOUND' } }));
    }
    response.end(JSON.stringify(shape(note)));
  });
}
