// A loopback job server: POST /jobs queues a 200 ms export job and answers 202, or 503 with
// Retry-After when the queue is full. Twenty requests arrive at once; then the program waits.
import http from 'node:http';
import { createJobQueue } from './app.js';
import { QueueFull } from './errors.js';

const queue = createJobQueue({ concurrency: 2, maxQueued: 8 });
let finished = 0;
const exportJob = () => new Promise((resolve) => setTimeout(resolve, 200)).then(() => (finished += 1));

const server = http.createServer((request, response) => {
  let refused = false;
  queue.add(exportJob).catch((error) => {
    if (error instanceof QueueFull) refused = true;
    else console.log(`%%jobFailed%%: ${error.message}`);
  });
  // A refusal is a promise rejected at once: its catch has run by the time setImmediate fires.
  setImmediate(() => {
    if (refused) response.writeHead(503, { 'retry-after': '1' }).end();
    else response.writeHead(202).end();
  });
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

try {
  const answers = await Promise.all(
    Array.from({ length: 20 }, () =>
      fetch(`${base}/jobs`, { method: 'POST', signal: AbortSignal.timeout(3000) }).then((r) => r.status),
    ),
  );
  const count = (status) => answers.filter((s) => s === status).length;
  const { running, waiting } = queue.stats();
  console.log(`202: ${count(202)}, 503: ${count(503)}; %%running%%: ${running}, %%waiting%%: ${waiting}`);
  const until = Date.now() + 4000;
  while (queue.stats().running + queue.stats().waiting > 0 && Date.now() < until) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  console.log(`%%finished%%: ${finished}`);
} finally {
  server.closeAllConnections();
  server.close();
}
