// consoleLines (shared/exercise.js): the text form of console entries that prediction checks compare
// and the prediction block shows.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { consoleLines } from '../../shared/exercise.js';

const str = (v) => ({ t: 'string', v });

test('a console.trace entry reads as the label, its arguments and one indented line per frame', () => {
  const lines = consoleLines([
    { level: 'log', args: [str('before')], at: 1 },
    { level: 'trace', args: [], stack: 'at formatAmount (index.js:2:11)\nat index.js:9:13', at: 2 },
    { level: 'trace', args: [str('amount'), { t: 'number', v: 210 }], stack: 'at formatAmount (index.js:3:11)', at: 3 },
    { level: 'system', code: 'console-cleared', args: [], at: 4 },
  ]);
  assert.deepEqual(lines, [
    'before',
    'console.trace\n    at formatAmount (index.js:2:11)\n    at index.js:9:13',
    'console.trace amount 210\n    at formatAmount (index.js:3:11)',
  ]);
});
