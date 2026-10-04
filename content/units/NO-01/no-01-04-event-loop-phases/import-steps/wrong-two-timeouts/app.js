// Misconception: two zero-delay timers are as good as setImmediate. The order comes out right,
// but the task asks for each tool once; 'save' should run in the check phase.
import { readFile } from 'node:fs';

export function runImport(file, log) {
  readFile(file, 'utf8', (error, text) => {
    if (error) {
      log(`error: ${error.code}`);
      return;
    }
    log('read');
    process.nextTick(() => log('validate'));
    Promise.resolve().then(() => log('total'));
    setTimeout(() => log('save'), 0);
    setTimeout(() => log('report'), 0);
  });
}
