// A demo (read-only): your perf check against the original service and against service.js,
// then the log line your service writes.
import { createService as original } from './original-service.js';
import { createService } from './service.js';
import { checkLatency } from './perf-check.js';

for (const [name, create] of [['original-service.js', original], ['service.js', createService]]) {
  try {
    console.log(`${name}: p95 ${await checkLatency(create)} ms — %%passed%%`);
  } catch (error) {
    console.log(`${name}: %%failed%% — ${error.message}`);
  }
}
const lines = [];
const server = createService([{ id: 'e-1', label: '%%lunch%%', category: 'food', amountMinor: 21050, payer: 'payer-1@example.invalid' }], { log: (line) => lines.push(line) });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
await (await fetch(`http://127.0.0.1:${server.address().port}/expenses?category=food&payer=payer-1%40example.invalid`, { signal: AbortSignal.timeout(2000) })).text();
server.closeAllConnections();
server.close();
console.log('%%logLine%%:', JSON.stringify(lines[0]));
