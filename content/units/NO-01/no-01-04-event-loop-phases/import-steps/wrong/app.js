// Misconception: setImmediate runs immediately, before anything else queued. It runs in the check
// phase, after the nextTick queue and the promise microtasks.
import { readFile } from 'node:fs';

export function runImport(file, log) {
  readFile(file, 'utf8', (error, text) => {
    if (error) {
      log(`error: ${error.code}`);
      return;
    }
    log('read');
    setImmediate(() => log('validate')); // "immediately"
    Promise.resolve().then(() => log('total'));
    process.nextTick(() => log('save'));
    setTimeout(() => log('report'), 0);
  });
}
