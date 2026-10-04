// Builds the notes API from the route table in routes.js (read-only: you edit only routes.js).
// Each row says which method and path start an operation and which statuses it answers with.
import http from 'node:http';
import { readJsonBody, sendEmpty, sendJson } from './http-helpers.js';
import { seedNotes } from './notes.js';
import { routes } from './routes.js';

export function createApp() {
  // A fresh copy for every app: two apps never share their notes.
  const notes = seedNotes.map((note) => ({ ...note }));
  let nextNumber = notes.length + 1;

  // What each operation does. `index` is the position of the note named in the path.
  const operations = {
    list: () => notes,
    read: (index) => notes[index],
    create: (index, body) => {
      const note = { id: `n-${nextNumber++}`, text: '', pinned: false, ...body };
      notes.push(note);
      return note;
    },
    replace: (index, body) => (notes[index] = { ...body, id: notes[index].id }),
    update: (index, body) => (notes[index] = { ...notes[index], ...body, id: notes[index].id }),
    remove: (index) => {
      notes.splice(index, 1);
      return undefined; // nothing to send back
    },
  };

  async function handle(request, response) {
    const { pathname } = new URL(request.url, 'http://localhost');
    for (const route of routes) {
      const params = matchPath(route.path, pathname);
      if (route.method !== request.method || params === null) continue;
      const operation = operations[route.operation];
      if (!operation) return sendJson(response, 500, { error: `routes.js: unknown operation "${route.operation}"` });
      let index = -1;
      const id = Object.values(params)[0];
      if (id !== undefined) {
        index = notes.findIndex((note) => note.id === id);
        if (index === -1) {
          if (typeof route.notFound !== 'number') return sendJson(response, 500, { error: `routes.js: the "${route.operation}" row has no notFound status` });
          return sendJson(response, route.notFound, { error: 'note not found' });
        }
      }
      const value = operation(index, await readJsonBody(request));
      if (value === undefined) return sendEmpty(response, route.success);
      return sendJson(response, route.success, value);
    }
    return sendJson(response, 404, { error: 'no route' });
  }

  return http.createServer((request, response) => {
    handle(request, response).catch((error) => sendJson(response, error.status ?? 500, { error: error.message }));
  });
}

// matchPath('/notes/:id', '/notes/n-1') → { id: 'n-1' }; null when the path does not fit the pattern.
function matchPath(pattern, pathname) {
  const wanted = String(pattern).split('/');
  const given = pathname.split('/');
  if (wanted.length !== given.length) return null;
  const params = {};
  for (let i = 0; i < wanted.length; i++) {
    if (wanted[i].startsWith(':')) params[wanted[i].slice(1)] = given[i];
    else if (wanted[i] !== given[i]) return null;
  }
  return params;
}
