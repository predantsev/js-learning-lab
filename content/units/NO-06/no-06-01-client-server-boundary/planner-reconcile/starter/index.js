// Loads today's list from the planner API and reconciles yesterday's cached copy with it.
import { createApp } from './app.js';
import { cachedTasks } from './cached.js';
import { reconcile } from './reconcile.js';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/v1/records`, { signal: AbortSignal.timeout(2000) });
  const serverList = await response.json();
  const cache = cachedTasks();
  const result = reconcile(cache, serverList);
  console.log(`%%shown%%: ${(result?.records ?? []).map((task) => `${task.id}${task.done ? ' ✓' : ''}`).join(', ')}`);
  console.log(`%%stale%%: ${(result?.stale ?? []).join(', ') || '—'}`);
  console.log(`%%deleted%%: ${(result?.deleted ?? []).join(', ') || '—'}`);
} finally {
  server.closeAllConnections();
  server.close();
}
