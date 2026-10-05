// Misconception: running everything at once (as Promise.all would) is fastest; only the total
// number of jobs in the system is capped, so nothing ever waits.
import { QueueFull } from './errors.js';

export function createJobQueue({ concurrency, maxQueued }) {
  let running = 0;
  return {
    add(job) {
      if (running >= concurrency + maxQueued) return Promise.reject(new QueueFull());
      running += 1;
      return Promise.resolve()
        .then(job)
        .finally(() => {
          running -= 1;
        });
    },
    stats() {
      return { running, waiting: 0 };
    },
  };
}
