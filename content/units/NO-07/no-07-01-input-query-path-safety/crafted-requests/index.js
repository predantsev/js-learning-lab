// Sends four crafted requests to the planner API and prints what each one reached.
import { createApp } from './app.js';
import { createTaskRepo } from './repo.js';

const repo = createTaskRepo();
const server = createApp(repo);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const targets = ['/tasks?limit=-1', '/tasks?limit=abc', '/tasks?sort=__proto__', '/reports/..%2Fsecret.txt'];
try {
  for (const target of targets) {
    const callsBefore = repo.calls;
    const response = await fetch(base + target, { signal: AbortSignal.timeout(2000) }); // never wait longer than 2 s
    const text = (await response.text()).trim();
    const reached = repo.calls > callsBefore ? '%%yes%%' : '%%no%%';
    console.log(`GET ${target} → ${response.status} · %%repoLabel%%: ${reached} · ${text.slice(0, 70)}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
