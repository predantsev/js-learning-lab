import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { seedNotes } from './data.js';

export const MAX_BODY_BYTES = 1024;

// Returns an http.Server (not listening yet) that serves the notes. See the task for the routes.
export function createNotesServer() {
  const notes = seedNotes.map((note) => ({ ...note }));
  return http.createServer((req, res) => {
    // TODO: replace this placeholder answer with the routes
    res.writeHead(501, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not implemented yet' }));
  });
}

// Runs only with `node notes.js` in your terminal: listen on 127.0.0.1 and stop cleanly on Ctrl+C.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // TODO
}
