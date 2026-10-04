// Started by crash-check.mjs: saves expenses one after another until it is killed.
// After every save that resolved it prints "saved <id>" — that save is confirmed.
import { createFileRepository } from './repository.js';

const dataDir = process.argv[2];
const repo = createFileRepository(dataDir, { maxBytes: 16 * 1024 * 1024 });
let n = (await repo.list()).length;
while (true) {
  n += 1;
  const id = `e-${String(n).padStart(4, '0')}`;
  // A long label makes every save write more bytes, so a kill lands mid-write more often.
  // (With 400 characters an in-place write was caught in only 1 of 5 runs of crash-check.mjs.)
  await repo.save({ id, label: `Lunch ${'#'.repeat(4000)}`, amountMinor: 21050, date: '2026-03-02', category: 'food' });
  console.log(`saved ${id}`);
}
