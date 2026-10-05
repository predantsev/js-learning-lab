// Checks for sumInBatches. The records count how often amountMinor is read; a "ticker" callback,
// rescheduled with setImmediate, notes how many reads happened since its previous turn.
import { sumInBatches } from './app.js';

function countedRecords(count) {
  const counter = { reads: 0 };
  const records = Array.from({ length: count }, (_, i) => ({
    id: `e-${i}`,
    get amountMinor() {
      counter.reads += 1;
      return (i % 50) + 1;
    },
  }));
  return { records, counter };
}

const expectedSum = (count) => Array.from({ length: count }, (_, i) => (i % 50) + 1).reduce((a, b) => a + b, 0);

test('resolves with the sum of every amountMinor, including a shorter last batch', async () => {
  expect(typeof sumInBatches, 'type of sumInBatches').toBe('function');
  const { records } = countedRecords(10_250);
  expect(await sumInBatches(records, 500), 'the total of 10250 records in batches of 500').toBe(expectedSum(10_250));
  expect(await sumInBatches(records.slice(0, 30), 500), 'the total of 30 records in batches of 500').toBe(expectedSum(30));
  expect(await sumInBatches([], 500), 'the total of no records').toBe(0);
});

test('other callbacks get a turn after at most batchSize records', async () => {
  expect(typeof sumInBatches, 'type of sumInBatches').toBe('function');
  const { records, counter } = countedRecords(10_000);
  const gaps = [];
  let finished = false;
  const tick = () => {
    gaps.push(counter.reads);
    counter.reads = 0;
    if (!finished) setImmediate(tick);
  };
  setImmediate(tick);
  await sumInBatches(records, 500);
  finished = true;
  gaps.push(counter.reads);
  expect(Math.max(...gaps), 'the most records read without letting a setImmediate callback run (batchSize 500)').toBeLessThanOrEqual(500);
});
