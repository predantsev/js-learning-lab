// Mistake: await on an already-resolved promise only waits for the microtask queue, which runs
// before any timer, I/O or setImmediate callback gets a turn.
export async function sumInBatches(records, batchSize) {
  let total = 0;
  for (let start = 0; start < records.length; start += batchSize) {
    for (const record of records.slice(start, start + batchSize)) total += record.amountMinor;
    await Promise.resolve();
  }
  return total;
}
