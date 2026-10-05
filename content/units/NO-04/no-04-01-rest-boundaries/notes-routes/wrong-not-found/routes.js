// Mistake: a missing note is treated as a bad request (400) instead of "not found" (404).
export const routes = [
  { operation: 'list', method: 'GET', path: '/notes', success: 200 },
  { operation: 'read', method: 'GET', path: '/notes/:id', success: 200, notFound: 400 },
  { operation: 'create', method: 'POST', path: '/notes', success: 201 },
  { operation: 'replace', method: 'PUT', path: '/notes/:id', success: 200, notFound: 400 },
  { operation: 'update', method: 'PATCH', path: '/notes/:id', success: 200, notFound: 400 },
  { operation: 'remove', method: 'DELETE', path: '/notes/:id', success: 204, notFound: 400 },
];
