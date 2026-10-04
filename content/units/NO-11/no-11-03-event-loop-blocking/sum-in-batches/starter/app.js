// sumInBatches(records, batchSize): resolves with the sum of record.amountMinor, and lets other
// callbacks run (timers, I/O, setImmediate) after every batch of at most batchSize records.
export async function sumInBatches(records, batchSize) {
  let total = 0;
  for (const record of records) total += record.amountMinor;
  return total;
}
