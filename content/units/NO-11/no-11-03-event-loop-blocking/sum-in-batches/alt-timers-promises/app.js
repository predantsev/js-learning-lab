// Alternative: the promise version of setImmediate from node:timers/promises, over slices.
import { setImmediate as nextTurn } from 'node:timers/promises';

export async function sumInBatches(records, batchSize) {
  let total = 0;
  for (let start = 0; start < records.length; start += batchSize) {
    total += records.slice(start, start + batchSize).reduce((sum, record) => sum + record.amountMinor, 0);
    await nextTurn();
  }
  return total;
}
