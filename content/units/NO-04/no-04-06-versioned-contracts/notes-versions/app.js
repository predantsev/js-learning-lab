// The notes API, version 1. The team wants to rename "title" to "heading".
import http from 'node:http';

export function createApp() {
  const notes = [{ id: 'n-1', heading: '%%gifts%%', text: '%%giftsText%%', pinned: false }];

  // How a stored note looks in each version of the API.
  const toV1 = (note) => ({ id: note.id, title: note.heading, text: note.text, pinned: note.pinned });
  // const toV2 = (note) => ({ id: note.id, heading: note.heading, text: note.text, pinned: note.pinned });
  const versions = {
    v1: toV1,
    // v2: toV2,
  };

  return http.createServer((request, response) => {
    const [version, collection, id] = request.url.split('/').filter((part) => part !== '');
    const note = notes.find((item) => item.id === id);
    const toVersion = versions[version];
    response.setHeader('content-type', 'application/json; charset=utf-8');
    if (collection !== 'notes' || !toVersion || !note) {
      response.statusCode = 404;
      return response.end(JSON.stringify({ error: { code: 'NOT_FOUND' } }));
    }
    response.end(JSON.stringify(toVersion(note)));
  });
}
