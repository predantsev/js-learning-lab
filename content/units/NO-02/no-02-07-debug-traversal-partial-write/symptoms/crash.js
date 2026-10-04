// withCrashingWrites(fn): runs fn while every writeFile of node:fs/promises writes only the first
// half of its data and then throws — a simulated crash in the middle of a write.
//
// How it differs from a real crash: the process keeps running (the error can be caught), the cut
// is always at half, and only writeFile is affected. syncBuiltinESMExports() makes modules that
// imported { writeFile } see the replacement too.
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';

export async function withCrashingWrites(fn) {
  const realWriteFile = fsp.writeFile;
  fsp.writeFile = async (file, data) => {
    const bytes = Buffer.from(data);
    await realWriteFile(file, bytes.subarray(0, Math.floor(bytes.length / 2)));
    throw new Error('simulated crash');
  };
  syncBuiltinESMExports();
  try {
    return await fn();
  } finally {
    fsp.writeFile = realWriteFile;
    syncBuiltinESMExports();
  }
}
