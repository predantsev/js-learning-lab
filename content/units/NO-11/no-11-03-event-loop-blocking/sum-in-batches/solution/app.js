// sumInBatches(records, batchSize): resolves with the sum of record.amountMinor, and lets other
// callbacks run (timers, I/O, setImmediate) after every batch of at most batchSize records.
export async function sumInBatches(records, batchSize) {
  let total = 0;
  for (let start = 0; start < records.length; start += batchSize) {
    const end = Math.min(start + batchSize, records.length);
    for (let i = start; i < end; i++) total += records[i].amountMinor;
    // A promise that setImmediate resolves: the rest of the work waits for the check phase,
    // so everything already waiting gets its turn first.
    await new Promise((resolve) => setImmediate(resolve));
  }
  return total;
}
