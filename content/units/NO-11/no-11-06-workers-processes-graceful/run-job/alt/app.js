// Alternative: an AbortSignal listener sets a flag, the loop checks it on every line, and the
// cleanup lives in nested finally blocks, one per resource.
import { open } from 'node:fs/promises';

export async function runJob(job, { signal, maxRecords }) {
  if (signal?.aborted) throw signal.reason;
  const handle = await open(job.inputPath);
  try {
    let count = 0;
    let total = 0;
    const progress = setInterval(() => job.onProgress(count), 20);
    try {
      const batch = [];
      for await (const line of handle.readLines()) {
        if (signal?.aborted) throw signal.reason;
        if (!line) continue;
        if (count === maxRecords) throw new RangeError('maxRecords exceeded');
        const record = JSON.parse(line);
        count++;
        total += record.amountMinor;
        batch.push(record);
        if (batch.length >= 100) await job.saveBatch(batch.splice(0));
      }
      if (batch.length) await job.saveBatch(batch);
      return { count, total };
    } finally {
      clearInterval(progress);
    }
  } finally {
    await handle.close();
  }
}
