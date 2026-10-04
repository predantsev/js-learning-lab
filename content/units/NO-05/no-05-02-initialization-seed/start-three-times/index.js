// Starts the planner server three times against one database file, then sends a request
// while a fourth start is still initializing.
import http from 'node:http';
import { mkdir, rm } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { initPlanner } from './planner-db.js';

const ORDER = 'init-then-listen'; // try 'listen-then-init'
const DB_FILE = 'data/planner.db';

// A free loopback port, found by a throwaway server, so that a request can be sent before listen().
const probe = http.createServer();
await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
const { port } = probe.address();
await new Promise((resolve) => probe.close(resolve));

async function start() {
  const db = new DatabaseSync(DB_FILE);
  const server = http.createServer((request, response) => {
    try {
      const tasks = db.prepare('SELECT id FROM tasks ORDER BY id').all();
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(tasks.map((task) => task.id)));
    } catch (error) {
      response.writeHead(500, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: error.message }));
    }
  });
  const listen = () => new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  if (ORDER === 'init-then-listen') {
    await initPlanner(db);
    await listen();
  } else {
    await listen();
    await initPlanner(db);
  }
  return { server, db };
}

async function stop({ server, db }) {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  db.close();
}

async function getTasks() {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/tasks`, { signal: AbortSignal.timeout(2000) });
    return `${response.status} ${await response.text()}`;
  } catch (error) {
    return `${error.cause?.code ?? error.name}`;
  }
}

await rm('data', { recursive: true, force: true });
await mkdir('data', { recursive: true });

for (const round of [1, 2, 3]) {
  const running = await start();
  console.log(`%%start%% ${round}: ${await getTasks()}`);
  if (round === 2) {
    running.db.prepare('DELETE FROM tasks WHERE id = ?').run('t-03');
    console.log('  %%deleted%% t-03');
  }
  await stop(running);
}

await rm('data', { recursive: true, force: true });
await mkdir('data', { recursive: true });
const starting = start();
await new Promise((resolve) => setTimeout(resolve, 50));
console.log(`%%early%% (${ORDER}): ${await getTasks()}`);
const running = await starting;
console.log(`%%afterStart%%: ${await getTasks()}`);
await stop(running);
