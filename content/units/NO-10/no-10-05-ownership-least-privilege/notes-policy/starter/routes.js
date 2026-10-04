// The note routes. Each returns { status, body? } or throws an HttpError.
import { HttpError } from './http-helpers.js';
import { can } from './policy.js';

export function listNotes(user, notes) {
  return { status: 200, body: notes };
}

export function readNote(user, notes, id) {
  const note = notes.find((candidate) => candidate.id === id);
  if (!note) throw new HttpError(404, 'NOT_FOUND');
  return { status: 200, body: note };
}

export function updateNote(user, notes, id, changes) {
  const note = notes.find((candidate) => candidate.id === id);
  if (!note) throw new HttpError(404, 'NOT_FOUND');
  note.title = String(changes?.title ?? note.title);
  return { status: 200, body: note };
}

export function deleteNote(user, notes, id) {
  const index = notes.findIndex((candidate) => candidate.id === id);
  if (index === -1) throw new HttpError(404, 'NOT_FOUND');
  notes.splice(index, 1);
  return { status: 204 };
}
