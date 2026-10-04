// The note routes with one guard per action.
import { HttpError } from './http-helpers.js';
import { can } from './policy.js';

function guard(user, notes, id, action) {
  const note = notes.find((candidate) => candidate.id === id);
  if (!note || !can(user, 'read', note)) throw new HttpError(404, 'NOT_FOUND');
  if (!can(user, action, note)) throw new HttpError(403, 'FORBIDDEN');
  return note;
}

export const listNotes = (user, notes) => ({ status: 200, body: notes.filter((note) => can(user, 'read', note)) });

export const readNote = (user, notes, id) => ({ status: 200, body: guard(user, notes, id, 'read') });

export function updateNote(user, notes, id, changes) {
  const note = guard(user, notes, id, 'update');
  if (changes?.title !== undefined) note.title = String(changes.title);
  return { status: 200, body: note };
}

export function deleteNote(user, notes, id) {
  const note = guard(user, notes, id, 'delete');
  notes.splice(notes.indexOf(note), 1);
  return { status: 204 };
}
