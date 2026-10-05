// Mistake: every success is 200, so a client cannot tell "created" or "nothing to send" from "here it is".
export const routes = [
  { operation: 'list', method: 'GET', path: '/notes', success: 200 },
  { operation: 'read', method: 'GET', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'create', method: 'POST', path: '/notes', success: 200 },
  { operation: 'replace', method: 'PUT', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'update', method: 'PATCH', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'remove', method: 'DELETE', path: '/notes/:id', success: 200, notFound: 404 },
];
