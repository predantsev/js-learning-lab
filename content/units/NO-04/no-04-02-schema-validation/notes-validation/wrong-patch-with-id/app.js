// The notes API. Create and replace already pass the body through validateNoteInput.
import http from 'node:http';
import { readJsonBody, sendJson } from './http-helpers.js';
import { seedNotes } from './notes.js';
import { validateNoteInput } from './validate.js';

export function createApp() {
  // A fresh copy for every app: two apps never share their notes.
  const notes = seedNotes.map((note) => ({ ...note }));
  let nextNumber = notes.length + 1;

  async function handle(request, response) {
    const parts = new URL(request.url, 'http://localhost').pathname.split('/').filter((part) => part !== '');
    if (parts[0] !== 'notes' || parts.length > 2) return sendJson(response, 404, { error: 'not found' });

    if (parts.length === 1) {
      if (request.method === 'GET') return sendJson(response, 200, notes);
      if (request.method === 'POST') {
        const result = validateNoteInput(await readJsonBody(request));
        if (!result.ok) return sendJson(response, 400, { errors: result.errors });
        const note = { id: `n-${nextNumber++}`, ...result.value };
        notes.push(note);
        return sendJson(response, 201, note);
      }
      return sendJson(response, 405, { error: 'method not allowed' });
    }

    const index = notes.findIndex((note) => note.id === parts[1]);
    if (index === -1) return sendJson(response, 404, { error: 'not found' });
    if (request.method === 'GET') return sendJson(response, 200, notes[index]);
    if (request.method === 'PUT') {
      const result = validateNoteInput(await readJsonBody(request));
      if (!result.ok) return sendJson(response, 400, { errors: result.errors });
      notes[index] = { id: parts[1], ...result.value };
      return sendJson(response, 200, notes[index]);
    }
    if (request.method === 'PATCH') {
      // Mistake: the merged note still holds `id`, a field the schema does not know,
      // so every PATCH is refused with id: "unknownField" — even a valid one.
      const result = validateNoteInput({ ...notes[index], ...(await readJsonBody(request)) });
      if (!result.ok) return sendJson(response, 400, { errors: result.errors });
      notes[index] = { id: parts[1], ...result.value };
      return sendJson(response, 200, notes[index]);
    }
    return sendJson(response, 405, { error: 'method not allowed' });
  }

  return http.createServer((request, response) => {
    handle(request, response).catch((error) => sendJson(response, error.status ?? 500, { error: error.message }));
  });
}
