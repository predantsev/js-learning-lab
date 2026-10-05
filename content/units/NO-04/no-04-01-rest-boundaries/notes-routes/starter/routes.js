// The route table of the notes API: one row per operation.
//   operation — list | read | create | replace | update | remove
//   method, path — what the client sends; write ":id" where the note's id goes
//   success — the status on success; notFound — the status when the note in the path does not exist
export const routes = [
  { operation: 'list', method: 'GET', path: '/notes', success: 200 },
  // Add the rows for read, create, replace, update and remove.
];
