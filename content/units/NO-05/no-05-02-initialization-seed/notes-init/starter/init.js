// Startup initialization of the notes store, and the server start that depends on it.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { readStore, writeStore } from './disk.js';
import { createApp } from './server.js';

export const VERSION = 1;

// initStore(file, fixtures): make sure `file` holds a store of VERSION and return it.
export async function initStore(file, fixtures) {
  // TODO: create what is missing, refuse what is unknown, seed only an empty store
}

// startServer(file, fixtures): resolves with the notes server listening on 127.0.0.1 (any free port).
export async function startServer(file, fixtures) {
  const server = createApp(file);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  initStore(file, fixtures);
  return server;
}
