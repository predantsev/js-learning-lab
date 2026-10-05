// Misconception: an async function runs its heavy work off the event loop. The batches are there,
// but nothing ever hands the loop back.
export async function sumInBatches(records, batchSize) {
  let total = 0;
  for (let start = 0; start < records.length; start += batchSize) {
    for (const record of records.slice(start, start + batchSize)) total += record.amountMinor;
  }
  return total;
}
