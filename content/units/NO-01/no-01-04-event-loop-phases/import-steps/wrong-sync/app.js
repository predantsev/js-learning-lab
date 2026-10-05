// Misconception: the right order is enough. Everything is logged synchronously, so nothing is
// scheduled and no queue or phase is used.
import { readFile } from 'node:fs';

export function runImport(file, log) {
  readFile(file, 'utf8', (error, text) => {
    if (error) {
      log(`error: ${error.code}`);
      return;
    }
    log('read');
    log('validate');
    log('total');
    log('save');
    log('report');
  });
}
