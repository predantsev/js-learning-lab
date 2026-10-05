// Imports the expense file in steps. After 'read', four steps must be logged in this order:
//   'validate' → 'total' → 'save' → 'report'
// Schedule each with a different tool, once each: process.nextTick, a promise callback,
// setImmediate and setTimeout(…, 0). Next to each, name in a comment the queue or phase it runs from.
import { readFile } from 'node:fs';

export function runImport(file, log) {
  readFile(file, 'utf8', (error, text) => {
    if (error) {
      log(`error: ${error.code}`);
      return;
    }
    log('read');
    process.nextTick(() => log('validate')); // nextTick queue: right after this callback
    Promise.resolve().then(() => log('total')); // promise microtasks: after the nextTick queue
    setImmediate(() => log('save')); // check phase: right after this poll phase
    setTimeout(() => log('report'), 0); // timers phase: the next round of the loop
  });
}
