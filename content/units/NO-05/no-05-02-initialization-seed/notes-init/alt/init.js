// Another valid shape: check for the file with access() first.
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { readStore, writeStore } from './disk.js';
import { createApp } from './server.js';

export const VERSION = 1;

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function initStore(file, fixtures) {
  if (!(await exists(file))) {
    await mkdir(path.dirname(file), { recursive: true });
    const created = { schemaVersion: VERSION, records: [...fixtures] };
    await writeStore(file, created);
    return created;
  }
  const store = await readStore(file);
  if (store.schemaVersion !== VERSION) throw new Error(`unsupported schemaVersion ${store.schemaVersion}`);
  if (store.records.length > 0) return store;
  const seeded = { ...store, records: [...fixtures] };
  await writeStore(file, seeded);
  return seeded;
}

export async function startServer(file, fixtures) {
  const server = createApp(file);
  await initStore(file, fixtures);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}
