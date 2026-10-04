// Rehearsing the two hard starts on the device. With SEED set to "legacy-v0" or "corrupt", App.tsx writes
// that snapshot under KEY before the first read (only in a development build, __DEV__). Put SEED back to
// "none" when you are done: otherwise every reload writes it again.
import legacy from '../data/legacy-v0.json';
import type { StorageAdapter } from './contracts.ts';
import { KEY } from './snapshot.ts';

export type Seed = 'none' | 'legacy-v0' | 'corrupt';

export const SEED: Seed = 'none';

// A snapshot cut off in the middle, as after an interrupted write.
const CORRUPT_TEXT = '{"schemaVersion":1,"records":[{"id":"t-04"';

export async function applySeed(storage: StorageAdapter, seed: Seed): Promise<void> {
  if (seed === 'legacy-v0') {
    await storage.setItem(KEY, JSON.stringify(legacy));
  } else if (seed === 'corrupt') {
    await storage.setItem(KEY, CORRUPT_TEXT);
  }
}
