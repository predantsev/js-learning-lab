// Another valid table: rows grouped by URL, a different parameter name, shared values in constants.
const COLLECTION = '/notes';
const ONE_NOTE = '/notes/:noteId';
const NOT_FOUND = 404;

export const routes = [
  { operation: 'list', method: 'GET', path: COLLECTION, success: 200 },
  { operation: 'create', method: 'POST', path: COLLECTION, success: 201 },
  { operation: 'read', method: 'GET', path: ONE_NOTE, success: 200, notFound: NOT_FOUND },
  { operation: 'update', method: 'PATCH', path: ONE_NOTE, success: 200, notFound: NOT_FOUND },
  { operation: 'replace', method: 'PUT', path: ONE_NOTE, success: 200, notFound: NOT_FOUND },
  { operation: 'remove', method: 'DELETE', path: ONE_NOTE, success: 204, notFound: NOT_FOUND },
];
