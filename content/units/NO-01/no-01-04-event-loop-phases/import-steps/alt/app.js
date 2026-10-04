// Another valid solution: written in a different order, with queueMicrotask as the microtask.
// The order of the lines does not decide the order of the output — the queues and phases do.
import { readFile } from 'node:fs';

export function runImport(file, log) {
  readFile(file, 'utf8', (error, text) => {
    if (error) {
      log(`error: ${error.code}`);
      return;
    }
    log('read');
    setTimeout(() => log('report'), 0); // timers: next round, after check
    setImmediate(() => log('save')); // check: after this poll phase
    queueMicrotask(() => log('total')); // microtask queue: after nextTick
    process.nextTick(() => log('validate')); // nextTick queue: first after the callback
  });
}
