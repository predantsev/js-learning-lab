// Misconception: an in-memory queue can grow as long as needed; jobs just wait a little longer.
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
        else waiting.push(entry);
      });
    },
    stats() {
      return { running, waiting: waiting.length };
    },
  };
}
