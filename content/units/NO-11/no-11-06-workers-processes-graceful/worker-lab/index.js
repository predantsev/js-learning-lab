// The same checksum on the main thread and in a worker thread, while a 10 ms "health" timer
// measures how late it fires. Then the cost of handing 50,000 records to a worker: copied or moved.
import { once } from 'node:events';
import { Worker } from 'node:worker_threads';
import { checksum } from './checksum.js';

const ROUNDS = 4000; // try 400
const amounts = Array.from({ length: 50_000 }, (_, i) => (i * 37) % 10_000);

// Every 10 ms note how late the timer fired: that is how long a /health request would wait.
function watchHealth() {
  let worst = 0;
  let expected = performance.now() + 10;
  const timer = setInterval(() => {
    worst = Math.max(worst, performance.now() - expected);
    expected = performance.now() + 10;
  }, 10);
  return () => (clearInterval(timer), worst);
}

const worker = new Worker(new URL('./checksum-worker.js', import.meta.url));
try {
  // Warm-up: the first call also pays for starting the worker and compiling the code.
  worker.postMessage({ amounts, rounds: 1 });
  await once(worker, 'message');
  checksum(amounts, 1);

  for (let run = 1; run <= 3; run++) {
    let stop = watchHealth();
    await new Promise((resolve) => setTimeout(resolve, 15)); // the health timer is ticking
    let started = performance.now();
    checksum(amounts, ROUNDS);
    const mainMs = performance.now() - started;
    await new Promise((resolve) => setTimeout(resolve, 15)); // let it notice how late it is
    const mainLate = stop();

    stop = watchHealth();
    started = performance.now();
    worker.postMessage({ amounts, rounds: ROUNDS });
    await once(worker, 'message');
    const workerMs = performance.now() - started;
    const workerLate = stop();
    console.log(`#${run} %%main%%: ${mainMs.toFixed(0)} %%ms%%, health %%late%% ${mainLate.toFixed(0)} %%ms%% | worker: ${workerMs.toFixed(0)} %%ms%%, health %%late%% ${workerLate.toFixed(0)} %%ms%%`);
  }

  // Handing data over: postMessage copies an array (structured clone); an ArrayBuffer in the
  // transfer list is moved instead — the sender can no longer use it.
  const records = Array.from({ length: 50_000 }, (_, i) => ({ id: `e-${i}`, amountMinor: amounts[i], category: 'food' }));
  for (let run = 1; run <= 3; run++) {
    let started = performance.now();
    worker.postMessage({ records, rounds: 1 }); // 50,000 objects, copied one by one
    await once(worker, 'message');
    const copyMs = performance.now() - started;

    const packed = new Uint32Array(records.length);
    for (let i = 0; i < records.length; i++) packed[i] = records[i].amountMinor;
    started = performance.now();
    worker.postMessage({ amounts: packed, rounds: 1 }, [packed.buffer]);
    await once(worker, 'message');
    const transferMs = performance.now() - started;
    console.log(`#${run} %%copied%%: ${copyMs.toFixed(1)} %%ms%%, %%moved%%: ${transferMs.toFixed(1)} %%ms%% (%%afterMove%% ${packed.length})`);
  }
} finally {
  await worker.terminate();
}
