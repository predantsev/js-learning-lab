// Sends 50 PATCH requests at the same time — each marks a DIFFERENT task done — to a planner server
// on each of three repositories, and counts how many changes survived.
import http from 'node:http';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { fileRepository, queuedFileRepository, sqliteRepository } from './repositories.js';

const COUNT = 50;
const ids = Array.from({ length: COUNT }, (_, i) => `t-${String(i + 1).padStart(2, '0')}`);

async function freshStores() {
  await rm('data', { recursive: true, force: true });
  await mkdir('data', { recursive: true });
  const records = ids.map((id) => ({ id, title: `%%task%% ${id}`, done: false }));
  await writeFile('data/planner.json', JSON.stringify({ schemaVersion: 1, records }));
  const db = new DatabaseSync('data/planner.db');
  db.exec('CREATE TABLE tasks (id TEXT PRIMARY KEY, title TEXT NOT NULL, done INTEGER NOT NULL)');
  const insert = db.prepare('INSERT INTO tasks VALUES (?, ?, 0)');
  for (const task of records) insert.run(task.id, task.title);
  db.close();
}

function createApp(repository) {
  return http.createServer(async (request, response) => {
    const match = /^\/tasks\/([\w-]+)$/.exec(request.url);
    if (request.method !== 'PATCH' || !match) {
      response.writeHead(404).end();
      return;
    }
    try {
      await repository.markDone(match[1]);
      response.writeHead(204).end();
    } catch (error) {
      response.writeHead(500, { 'content-type': 'application/json' }).end(JSON.stringify({ error: error.message }));
    }
  });
}

async function run(name, repository) {
  const server = createApp(repository);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const answers = await Promise.all(ids.map((id) => fetch(`${base}/tasks/${id}`, { method: 'PATCH', signal: AbortSignal.timeout(3000) })));
    const confirmed = answers.filter((answer) => answer.status === 204).length;
    const done = await repository.doneCount();
    console.log(`${name}: ${confirmed} %%confirmed%%, ${done} %%stored%% → ${confirmed - done} %%lost%%`);
  } finally {
    server.closeAllConnections();
    server.close();
    repository.close?.();
  }
}

await freshStores();
await run('file', fileRepository('data/planner.json'));
await freshStores();
await run('file + queue', queuedFileRepository('data/planner.json'));
await freshStores();
await run('sqlite UPDATE', sqliteRepository('data/planner.db'));
