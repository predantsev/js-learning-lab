// The note routes. Each returns { status, body? } or throws an HttpError.
import { HttpError } from './http-helpers.js';
import { can } from './policy.js';

// Finds a note the user may at least read. A note they may not read is answered exactly
// like a missing one (404), so its existence stays hidden.
function findReadable(user, notes, id) {
  const note = notes.find((candidate) => candidate.id === id);
  if (!note || !can(user, 'read', note)) throw new HttpError(404, 'NOT_FOUND');
  return note;
}

// They can see the note, but not do this to it: 403.
function requireAllowed(user, action, note) {
  if (!can(user, action, note)) throw new HttpError(403, 'FORBIDDEN');
}

export function listNotes(user, notes) {
  return { status: 200, body: notes.filter((note) => can(user, 'read', note)) };
}

export function readNote(user, notes, id) {
  return { status: 200, body: findReadable(user, notes, id) };
}

export function updateNote(user, notes, id, changes) {
  const note = findReadable(user, notes, id);
  requireAllowed(user, 'update', note);
  note.title = String(changes?.title ?? note.title);
  return { status: 200, body: note };
}

export function deleteNote(user, notes, id) {
  const note = findReadable(user, notes, id);
  requireAllowed(user, 'delete', note);
  notes.splice(notes.indexOf(note), 1);
  return { status: 204 };
}
