// A demo (read-only): three contract checks against the habit service on loopback.
import { createApp } from './app.js';
import { habitSummarySchema } from './contract.js';
import { expectContract } from './expect-contract.js';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const path of ['/habits', '/habits/summary', '/habits/h-99']) {
    try {
      const body = await expectContract(await fetch(base + path, { signal: AbortSignal.timeout(2000) }), habitSummarySchema);
      console.log(`${path}: %%kept%% (${Array.isArray(body) ? body.length : 1})`);
    } catch (error) {
      console.log(`${path}: ${error.name}\n${error.message}`);
    }
  }
} finally {
  server.closeAllConnections();
  server.close();
}
