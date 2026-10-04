// runJob(job, { signal, maxRecords }): imports the JSON lines of job.inputPath in batches of 100
// through job.saveBatch(batch), calls job.onProgress(count) every 20 ms, and resolves with
// { count, total } (total = the sum of amountMinor). It holds one FileHandle and one interval.
import { open } from 'node:fs/promises';

export async function runJob(job, { signal, maxRecords }) {
  const handle = await open(job.inputPath);
  let count = 0;
  let total = 0;
  setInterval(() => job.onProgress(count), 20);
  let batch = [];
  for await (const line of handle.readLines()) {
    if (line === '') continue;
    const record = JSON.parse(line);
    count += 1;
    total += record.amountMinor;
    batch.push(record);
    if (batch.length === 100) {
      await job.saveBatch(batch);
      batch = [];
    }
  }
  if (batch.length > 0) await job.saveBatch(batch);
  return { count, total };
}
