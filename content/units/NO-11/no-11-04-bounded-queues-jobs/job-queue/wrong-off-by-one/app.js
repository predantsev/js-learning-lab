// Mistake: <= lets one job more than maxQueued wait.
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
        if (waiting.length > 0) start(waiting.shift());
      });
  }

  return {
    add(job) {
      return new Promise((resolve, reject) => {
        const entry = { job, resolve, reject };
        if (running < concurrency) start(entry);
        else if (waiting.length <= maxQueued) waiting.push(entry);
        else reject(new QueueFull());
      });
    },
    stats() {
      return { running, waiting: waiting.length };
    },
  };
}
