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
    // Schedule the four steps here.
  });
}
