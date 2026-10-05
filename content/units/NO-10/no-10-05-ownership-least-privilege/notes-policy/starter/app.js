// The notes lab service (read-only): identifies the caller, then hands the request to routes.js.
// A route returns { status, body? } or throws an HttpError.
import http from 'node:http';
import { HttpError, readJsonBody, sendEmpty, sendError, sendJson } from './http-helpers.js';
import { labCredentials, seedNotes, users } from './lab-data.js';
import { deleteNote, listNotes, readNote, updateNote } from './routes.js';

export function createApp() {
  const notes = seedNotes.map((note) => ({ ...note, readers: [...note.readers] }));

  async function handle(request, response) {
    const userId = labCredentials.get(/^Bearer (\S+)$/.exec(request.headers.authorization ?? '')?.[1]);
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) return sendError(response, 401, 'UNAUTHENTICATED', { 'www-authenticate': 'Bearer' });

    const path = new URL(request.url, 'http://localhost').pathname;
    const id = /^\/notes\/([^/]+)$/.exec(path)?.[1];
    let result;
    if (path === '/notes' && request.method === 'GET') result = listNotes(user, notes);
    else if (id && request.method === 'GET') result = readNote(user, notes, id);
    else if (id && request.method === 'PATCH') result = updateNote(user, notes, id, await readJsonBody(request));
    else if (id && request.method === 'DELETE') result = deleteNote(user, notes, id);
    else return sendError(response, 404, 'NOT_FOUND');
    if (result.body === undefined) return sendEmpty(response, result.status);
    return sendJson(response, result.status, result.body);
  }

  return http.createServer((request, response) => {
    handle(request, response).catch((error) => {
      if (error instanceof HttpError) sendError(response, error.status, error.code);
      else sendError(response, 500, 'INTERNAL');
    });
  });
}
