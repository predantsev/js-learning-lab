// createReportRunner({ concurrency, maxQueued, maxAttempts, baseMs, store, random }):
// a bounded runner of report jobs. The task describes the whole contract.
import { QueueFull, ShutdownError } from './errors.js';

export function createReportRunner({ concurrency, maxQueued, maxAttempts, baseMs, store, random = Math.random }) {
  return {
    submit(job, { signal } = {}) {
      return Promise.reject(new Error('not implemented'));
    },
    shutdown() {
      return Promise.resolve();
    },
  };
}
