// Mistake: the loop counts only full batches, so a shorter last batch is never added.
export async function sumInBatches(records, batchSize) {
  let total = 0;
  const batches = Math.floor(records.length / batchSize);
  for (let b = 0; b < batches; b++) {
    for (let i = b * batchSize; i < (b + 1) * batchSize; i++) total += records[i].amountMinor;
    await new Promise((resolve) => setImmediate(resolve));
  }
  return total;
}
