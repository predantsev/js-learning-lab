// Startup initialization of the notes store, and the server start that depends on it.
// Mistake: it adds the fixtures on every start.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { readStore, writeStore } from './disk.js';
import { createApp } from './server.js';

export const VERSION = 1;

// initStore(file, fixtures): make sure `file` holds a store of VERSION and return it.
export async function initStore(file, fixtures) {
  await mkdir(path.dirname(file), { recursive: true });
  let store;
  try {
    store = await readStore(file);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error; // a damaged store is not a missing one
    store = { schemaVersion: VERSION, records: [] };
  }
  if (store.schemaVersion !== VERSION) {
    throw new Error(`notes store has schemaVersion ${store.schemaVersion}, expected ${VERSION}`);
  }
  {
    store = { schemaVersion: VERSION, records: [...store.records, ...fixtures] };
    await writeStore(file, store);
  }
  return store;
}

// startServer(file, fixtures): resolves with the notes server listening on 127.0.0.1 (any free port).
export async function startServer(file, fixtures) {
  await initStore(file, fixtures);
  const server = createApp(file);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server;
}
