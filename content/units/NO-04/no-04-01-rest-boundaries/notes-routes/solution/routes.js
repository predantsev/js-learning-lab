// The route table of the notes API: one row per operation.
//   operation — list | read | create | replace | update | remove
//   method, path — what the client sends; write ":id" where the note's id goes
//   success — the status on success; notFound — the status when the note in the path does not exist
export const routes = [
  { operation: 'list', method: 'GET', path: '/notes', success: 200 },
  { operation: 'read', method: 'GET', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'create', method: 'POST', path: '/notes', success: 201 },
  { operation: 'replace', method: 'PUT', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'update', method: 'PATCH', path: '/notes/:id', success: 200, notFound: 404 },
  { operation: 'remove', method: 'DELETE', path: '/notes/:id', success: 204, notFound: 404 },
];
