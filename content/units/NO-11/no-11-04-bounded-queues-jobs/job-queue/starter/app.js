// createJobQueue({ concurrency, maxQueued }): runs at most `concurrency` jobs at once and keeps at
// most `maxQueued` more waiting. add(job) returns a promise of the job's result; a job that finds
// the queue full is rejected at once with QueueFull. stats() reports { running, waiting }.
import { QueueFull } from './errors.js';

export function createJobQueue({ concurrency, maxQueued }) {
  let running = 0;
  return {
    add(job) {
      // Starts every job at once — there is no limit yet.
      running += 1;
      return job().finally(() => {
        running -= 1;
      });
    },
    stats() {
      return { running, waiting: 0 };
    },
  };
}
