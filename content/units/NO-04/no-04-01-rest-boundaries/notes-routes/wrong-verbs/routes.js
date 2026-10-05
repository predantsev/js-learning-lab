// Misconception: every action gets its own verb-style URL, and POST carries it.
export const routes = [
  { operation: 'list', method: 'GET', path: '/notes', success: 200 },
  { operation: 'read', method: 'GET', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'create', method: 'POST', path: '/notes/create', success: 201 },
  { operation: 'replace', method: 'PUT', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'update', method: 'PATCH', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'remove', method: 'POST', path: '/notes/:id/delete', success: 204, notFound: 404 },
];
