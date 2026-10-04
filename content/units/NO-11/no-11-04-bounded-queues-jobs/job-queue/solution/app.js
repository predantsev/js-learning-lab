// createJobQueue({ concurrency, maxQueued }): runs at most `concurrency` jobs at once and keeps at
// most `maxQueued` more waiting. add(job) returns a promise of the job's result; a job that finds
// the queue full is rejected at once with QueueFull. stats() reports { running, waiting }.
import { QueueFull } from './errors.js';

export function createJobQueue({ concurrency, maxQueued }) {
  let running = 0;
  const waiting = []; // FIFO: push at the end, shift from the front

  function start({ job, resolve, reject }) {
    running += 1;
    // Promise.resolve().then(job) also turns a job that throws synchronously into a rejection.
    Promise.resolve()
      .then(job)
      .then(resolve, reject)
      .finally(() => {
        running -= 1;
        if (waiting.length > 0) start(waiting.shift());
      });
  }

  return {
    add(job) {
      return new Promise((resolve, reject) => {
        const entry = { job, resolve, reject };
        if (running < concurrency) start(entry);
        else if (waiting.length < maxQueued) waiting.push(entry);
        else reject(new QueueFull());
      });
    },
    stats() {
      return { running, waiting: waiting.length };
    },
  };
}
