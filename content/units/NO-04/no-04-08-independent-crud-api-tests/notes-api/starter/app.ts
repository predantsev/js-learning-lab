// The notes API. Build it here: the task lists every route, status and error code.
import http from 'node:http';
import { readBodyText, sendJson } from './http-helpers.js';
import { seedNotes } from './notes.ts';
import { createNotesRepo } from './repo.ts';
import type { NotesRepo } from './repo.ts';

type Options = { repo?: NotesRepo; deadlineMs?: number };

export function createApp({ repo = createNotesRepo(seedNotes), deadlineMs = 1000 }: Options = {}): http.Server {
  return http.createServer((request, response) => {
    sendJson(response, 501, { error: { code: 'NOT_IMPLEMENTED', details: {} } });
  });
}
