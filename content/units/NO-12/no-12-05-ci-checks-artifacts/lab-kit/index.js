// Runs create-lab.mjs here (it writes ./no12-lab), then starts the generated planner service on
// loopback with a data folder of its own and asks it for the tasks — a quick proof that the kit works.
// lint, typecheck and the CI script need npm packages, so they run only in your terminal.
await import('./create-lab.mjs');
const { openStore } = await import('./no12-lab/src/store.ts');
const { createApp } = await import('./no12-lab/src/app.ts');

const server = createApp(await openStore(`${process.cwd()}/lab-data`));
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/tasks`, { signal: AbortSignal.timeout(2000) });
  const tasks = await response.json();
  console.log(`GET /tasks → ${response.status}: ${tasks.map((task) => `${task.id} ${task.priority}`).join(', ')}`);
} finally {
  server.closeAllConnections();
  server.close();
}
