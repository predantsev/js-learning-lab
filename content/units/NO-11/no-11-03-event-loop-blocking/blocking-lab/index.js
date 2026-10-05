// A loopback lab server: GET /checksum hashes 50,000 expenses on the main thread, GET /health
// answers at once. While a checksum runs, the driver asks /health and measures how long it waits.
import http from 'node:http';
import { monitorEventLoopDelay } from 'node:perf_hooks';

const MODE = 'sync'; // try 'async', then 'batched'
const BATCH_SIZE = 1000; // records per batch in 'batched' mode

const expenses = Array.from({ length: 50_000 }, (_, i) => ({
  id: `e-${i}`,
  title: `%%expense%% ${i}`,
  amountMinor: (i * 37) % 10_000,
  category: ['food', 'transport', 'home'][i % 3],
}));

// FNV-1a over the JSON text of one record: pure CPU work, no I/O.
function hashRecord(record, hash) {
  const text = JSON.stringify(record);
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  return hash;
}

function checksumSync(records) {
  let hash = 2166136261;
  for (let round = 0; round < 6; round++) for (const record of records) hash = hashRecord(record, hash);
  return hash;
}

async function checksumAsync(records) {
  return checksumSync(records); // "async" changes the return type, not the thread
}

async function checksumBatched(records) {
  let hash = 2166136261;
  for (let round = 0; round < 6; round++) {
    for (let start = 0; start < records.length; start += BATCH_SIZE) {
      for (const record of records.slice(start, start + BATCH_SIZE)) hash = hashRecord(record, hash);
      await new Promise((resolve) => setImmediate(resolve)); // let waiting callbacks run
    }
  }
  return hash;
}

const checksum = { sync: checksumSync, async: checksumAsync, batched: checksumBatched }[MODE];

const server = http.createServer(async (request, response) => {
  if (request.url === '/checksum') {
    const hash = await checksum(expenses);
    response.end(String(hash));
  } else response.end('ok');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const get = (path) => fetch(base + path, { signal: AbortSignal.timeout(5000) }).then((r) => r.text());

// The driver lives in the same process as the server, so a blocked loop holds it up too: its
// 20 ms timer fires only when the loop is free. Waiting is counted from the planned 20 ms mark.
async function oneRound() {
  const started = performance.now();
  const checksumDone = get('/checksum').then(() => performance.now() - started);
  await new Promise((resolve) => setTimeout(resolve, 20)); // planned: 20 ms after /checksum
  const timerMs = performance.now() - started;
  await get('/health');
  const healthMs = performance.now() - (started + 20);
  return { timerMs, healthMs, checksumMs: await checksumDone };
}

try {
  await oneRound(); // warm-up: the first round also pays for starting up
  const delay = monitorEventLoopDelay({ resolution: 10 });
  delay.enable();
  for (let run = 1; run <= 3; run++) {
    const { timerMs, healthMs, checksumMs } = await oneRound();
    console.log(`${MODE} #${run}: %%timer20%% ${timerMs.toFixed(0)} %%ms%%; /health %%waited%% ${healthMs.toFixed(0)} %%ms%%; /checksum %%took%% ${checksumMs.toFixed(0)} %%ms%%`);
  }
  delay.disable();
  console.log(`%%loopDelay%%: p99 ${(delay.percentile(99) / 1e6).toFixed(0)} %%ms%%, max ${(delay.max / 1e6).toFixed(0)} %%ms%%`);
} finally {
  server.closeAllConnections();
  server.close();
}
