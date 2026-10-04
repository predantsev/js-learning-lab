// Builds the planner service, then starts the artifact three times with different environments.
// The course sandbox gives the process an empty environment, so this file sets process.env itself
// before each start; in a terminal the shell does that: `PORT=abc node release/server.js`.
await import('./build.js');
const { start } = await import('./release/server.js');

const runs = [
  { PORT: 'abc', DATA_DIR: 'data', NODE_ENV: 'production' },
  { PORT: '0', NODE_ENV: 'production' },
  { PORT: '0', DATA_DIR: 'data' },
];
for (const env of runs) {
  for (const key of ['PORT', 'DATA_DIR', 'NODE_ENV']) delete process.env[key];
  Object.assign(process.env, env);
  const label = Object.entries(env).map(([key, value]) => `${key}=${value}`).join(' ');
  let server;
  try {
    server = await start();
  } catch (error) {
    console.log(`${label} → %%notStarted%%: ${error.name} ${error.message}`);
    continue;
  }
  const response = await fetch(`http://127.0.0.1:${server.address().port}/tasks`, { signal: AbortSignal.timeout(2000) });
  console.log(`${label} → %%listening%%; GET /tasks → ${response.status}`);
  await response.text();
  server.closeAllConnections();
  server.close();
}
