// Mistake: finally clears the interval but never closes the FileHandle; readLines() closes it only
// when it reads to the end, so a RangeError or an abort leaves the file open.
// runJob(job, { signal, maxRecords }): imports the JSON lines of job.inputPath in batches of 100
// through job.saveBatch(batch), calls job.onProgress(count) every 20 ms, and resolves with
// { count, total } (total = the sum of amountMinor). It holds one FileHandle and one interval.
import { open } from 'node:fs/promises';

export async function runJob(job, { signal, maxRecords }) {
  signal?.throwIfAborted();
  const handle = await open(job.inputPath);
  let count = 0;
  let total = 0;
  const progress = setInterval(() => job.onProgress(count), 20);
  try {
    let batch = [];
    for await (const line of handle.readLines()) {
      if (line === '') continue;
      count += 1;
      if (count > maxRecords) throw new RangeError(`the job has more than ${maxRecords} records`);
      const record = JSON.parse(line);
      total += record.amountMinor;
      batch.push(record);
      if (batch.length === 100) {
        await job.saveBatch(batch);
        signal?.throwIfAborted(); // check between batches: the job stops at a safe point
        batch = [];
      }
    }
    if (batch.length > 0) await job.saveBatch(batch);
    return { count, total };
  } finally {
    // Only the interval is released here: the FileHandle is left to close by itself.
    clearInterval(progress);
  }
}
