// Misconception: Node closes a job's file handles and timers by itself when the job ends — here only
// the happy path cleans up; a RangeError or an abort leaves the file open and the interval running.
import { open } from 'node:fs/promises';

export async function runJob(job, { signal, maxRecords }) {
  signal?.throwIfAborted();
  const handle = await open(job.inputPath);
  let count = 0;
  let total = 0;
  const progress = setInterval(() => job.onProgress(count), 20);
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
      signal?.throwIfAborted();
      batch = [];
    }
  }
  if (batch.length > 0) await job.saveBatch(batch);
  clearInterval(progress);
  await handle.close();
  return { count, total };
}
