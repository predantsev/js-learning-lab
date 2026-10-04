// Misconception: PUT and PATCH are the same thing, so which one replaces does not matter.
export const routes = [
  { operation: 'list', method: 'GET', path: '/notes', success: 200 },
  { operation: 'read', method: 'GET', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'create', method: 'POST', path: '/notes', success: 201 },
  { operation: 'replace', method: 'PATCH', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'update', method: 'PUT', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'remove', method: 'DELETE', path: '/notes/:id', success: 204, notFound: 404 },
];
