// Alternative: count the records and yield with a zero-delay timer after every full batch.
export async function sumInBatches(records, batchSize) {
  let total = 0;
  let inBatch = 0;
  for (const record of records) {
    total += record.amountMinor;
    inBatch += 1;
    if (inBatch === batchSize) {
      inBatch = 0;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  return total;
}
