// Mistake: pop() takes the newest waiting job, so the first ones wait the longest.
import { QueueFull } from './errors.js';

export function createJobQueue({ concurrency, maxQueued }) {
  let running = 0;
  const waiting = [];

  function start({ job, resolve, reject }) {
    running += 1;
    Promise.resolve()
      .then(job)
      .then(resolve, reject)
      .finally(() => {
        running -= 1;
        if (waiting.length > 0) start(waiting.pop());
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
