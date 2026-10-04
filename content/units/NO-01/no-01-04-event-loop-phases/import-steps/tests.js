// runImport is run with a recording `log`. While the readFile callback runs, process.nextTick,
// setImmediate and setTimeout are wrapped to count how often the learner's code calls them.
import { runImport } from './app.js';

async function runRecorded() {
  const lines = [];
  const counts = { nextTick: 0, setImmediate: 0, setTimeout: 0 };
  const original = { nextTick: process.nextTick, setImmediate: globalThis.setImmediate, setTimeout: globalThis.setTimeout };
  let inCallback = false;
  process.nextTick = function (...args) {
    if (inCallback) counts.nextTick += 1;
    return original.nextTick.apply(process, args);
  };
  globalThis.setImmediate = function (...args) {
    if (inCallback) counts.setImmediate += 1;
    return original.setImmediate(...args);
  };
  globalThis.setTimeout = function (...args) {
    if (inCallback) counts.setTimeout += 1;
    return original.setTimeout(...args);
  };
  try {
    runImport('expenses.json', (line) => {
      lines.push(line);
      if (line === 'read') {
        // The callback is running now; this tick ends the counting as soon as it returns.
        inCallback = true;
        original.nextTick.call(process, () => { inCallback = false; });
      }
    });
    await waitFor(() => lines.length >= 5 || String(lines[0]).startsWith('error'), { timeout: 1500 }).catch(() => {});
    await sleep(30);
  } finally {
    process.nextTick = original.nextTick;
    globalThis.setImmediate = original.setImmediate;
    globalThis.setTimeout = original.setTimeout;
  }
  return { lines, counts };
}

test('logs read, validate, total, save and report in this order', async () => {
  expect(typeof runImport, 'type of runImport').toBe('function');
  const { lines } = await runRecorded();
  expect(lines, 'the logged steps').toEqual(['read', 'validate', 'total', 'save', 'report']);
});

test('uses process.nextTick, setImmediate and setTimeout once each', async () => {
  expect(typeof runImport, 'type of runImport').toBe('function');
  const { counts } = await runRecorded();
  expect(counts, 'calls inside the readFile callback').toEqual({ nextTick: 1, setImmediate: 1, setTimeout: 1 });
});
