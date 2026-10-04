// Alternative: an async runner that awaits the job in try/finally and then pulls the next one.
import { QueueFull } from './errors.js';

export function createJobQueue({ concurrency, maxQueued }) {
  let active = 0;
  const queue = [];

  async function run(job) {
    active += 1;
    try {
      return await job();
    } finally {
      active -= 1;
      const next = queue.shift();
      if (next) next();
    }
  }

  return {
    add(job) {
      if (active < concurrency) return run(job);
      if (queue.length >= maxQueued) return Promise.reject(new QueueFull(`queue of ${maxQueued} is full`));
      return new Promise((resolve, reject) => {
        queue.push(() => run(job).then(resolve, reject));
      });
    },
    stats() {
      return { running: active, waiting: queue.length };
    },
  };
}
