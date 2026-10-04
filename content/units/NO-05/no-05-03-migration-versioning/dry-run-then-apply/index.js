// Upgrades data/wishlist.json to version 2: first on a copy (a dry run), and only when every check
// passes does the live file get replaced — in one rename, so the version changes together with the data.
import { copyFile, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { facts, migrate1to2 } from './migrate.js';

const LIVE = 'data/wishlist.json';
const COPY = 'data/wishlist.dry-run.json';

async function upgrade() {
  const live = JSON.parse(await readFile(LIVE, 'utf8'));
  if (live.schemaVersion === 2) return '%%nothing%%';

  await copyFile(LIVE, COPY);
  try {
    const before = JSON.parse(await readFile(COPY, 'utf8'));
    const after = migrate1to2(before);
    const again = migrate1to2(after);
    const was = facts(before);
    const now = facts(after);
    for (const key of Object.keys(was)) {
      if (was[key] !== now[key]) throw new Error(`${key}: ${was[key]} → ${now[key]}`);
    }
    if (JSON.stringify(again) !== JSON.stringify(after)) throw new Error('a rerun changes the store');
    console.log(`  %%dryRunOk%%: ${JSON.stringify(now)}`);

    await writeFile(`${LIVE}.tmp`, JSON.stringify(after, null, 2));
    await rename(`${LIVE}.tmp`, LIVE); // data and version 2 become visible in the same moment
    return '%%applied%%';
  } catch (error) {
    return `%%refused%%: ${error.message}`;
  } finally {
    await rm(COPY, { force: true }); // the copy is scratch: discarded after the dry run
  }
}

console.log(`1: ${await upgrade()}`);
console.log(`2: ${await upgrade()}`);
const stored = JSON.parse(await readFile(LIVE, 'utf8'));
console.log(`%%live%%: schemaVersion ${stored.schemaVersion}, ${JSON.stringify(stored.records[1])}`);
