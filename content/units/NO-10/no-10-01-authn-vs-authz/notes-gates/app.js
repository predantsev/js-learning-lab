// The lab notes service with its two gates: who is calling (authentication)
// and may they do this (authorization). Only then does the handler touch the note.
import http from 'node:http';
import { HttpError, sendError, sendJson } from './http-helpers.js';
import { labCredentials, seedNotes, users } from './lab-data.js';

// Gate 1 — authentication: turns the credential into a user, or 401.
function identify(request) {
  const match = /^Bearer (\S+)$/.exec(request.headers.authorization ?? '');
  const userId = match ? labCredentials.get(match[1]) : undefined;
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) throw new HttpError(401, 'UNAUTHENTICATED');
  return user;
}

// Gate 2 — authorization: may THIS user read THIS note? Otherwise 403.
function checkCanRead(user, note) {
  if (note.ownerId !== user.id) throw new HttpError(403, 'FORBIDDEN');
}

export function createApp() {
  const notes = seedNotes.map((note) => ({ ...note }));

  return http.createServer((request, response) => {
    try {
      const user = identify(request);
      const match = /^\/notes\/([^/]+)$/.exec(new URL(request.url, 'http://localhost').pathname);
      const note = match ? notes.find((candidate) => candidate.id === match[1]) : undefined;
      if (!note) throw new HttpError(404, 'NOT_FOUND');
      checkCanRead(user, note);
      sendJson(response, 200, note);
    } catch (error) {
      sendError(response, error);
    }
  });
}
