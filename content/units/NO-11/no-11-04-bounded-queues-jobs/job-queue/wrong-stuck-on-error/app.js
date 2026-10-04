// Mistake: the next job starts only after a success, so one failing job leaves a slot taken forever.
import { QueueFull } from './errors.js';

export function createJobQueue({ concurrency, maxQueued }) {
  let running = 0;
  const waiting = [];

  function start({ job, resolve, reject }) {
    running += 1;
    Promise.resolve()
      .then(job)
      .then((value) => {
        running -= 1;
        if (waiting.length > 0) start(waiting.shift());
        resolve(value);
      }, reject);
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
