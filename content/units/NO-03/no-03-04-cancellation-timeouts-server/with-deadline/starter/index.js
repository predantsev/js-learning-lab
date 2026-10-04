// Driver (read-only): three requests to GET /total with different repositories and clients.
import { createApp } from './server.js';
import { createRepository } from './repository.js';

const t0 = performance.now();
const log = (text) => console.log(`${String(Math.round(performance.now() - t0)).padStart(5)} ms  ${text}`);

async function scenario(title, { deadlineMs, delayMs, clientWaitMs }) {
  log(`— ${title}`);
  const server = createApp({ deadlineMs, repository: createRepository({ delayMs }), log });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/total`, { signal: AbortSignal.timeout(clientWaitMs) });
    log(`[client] ${response.status} ${await response.text()}`);
  } catch (error) {
    log(`[client] %%gaveUp%% ${error.name}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 150)); // give the server a moment to log
  server.closeAllConnections();
  server.close();
}

await scenario('%%fast%%', { deadlineMs: 300, delayMs: 100, clientWaitMs: 2000 });
await scenario('%%slow%%', { deadlineMs: 300, delayMs: 1500, clientWaitMs: 2000 });
await scenario('%%leaves%%', { deadlineMs: 2000, delayMs: 1500, clientWaitMs: 200 });
