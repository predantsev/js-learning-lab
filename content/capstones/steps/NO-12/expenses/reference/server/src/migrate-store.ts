// Moves the stored expenses from schemaVersion 1 to 2: `npm run migrate` in server/, with the server
// stopped. First a dry run on a copy in memory (kept + quarantined = the count before, the same ids and
// per-category totals, a second run changes nothing); only then the files are written, each in one atomic
// step: first data/expenses.quarantine.json with the records version 2 refuses, then the store, in which
// version 2 appears together with the kept records. A quarantine file that already exists is never
// overwritten: it may hold records a person has not repaired yet. When the dry run fails or the
// quarantine file is in the way, nothing is touched and the store stays on version 1, whole.
import { access } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "./config.ts";
import { DATA_FILE_NAME, MAX_DATA_BYTES } from "./fileRepository.ts";
import { readTextBounded, resolveInside, writeAtomic } from "./files.ts";
import { dryRun, QUARANTINE_FILE_NAME, quarantineText } from "./migrate.ts";
import type { AnyStore } from "./migrate.ts";

// "1 expense", "5 expenses".
const expenses = (count: number) => `${count} ${count === 1 ? "expense" : "expenses"}`;

// The path as the person typing the command sees it: data/expenses.quarantine.json from server/.
function shownPath(file: string): string {
  const relative = path.relative(process.cwd(), file);
  return relative.startsWith("..") ? file : relative;
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<number> {
  const config = loadConfig(process.env);
  if (!config.ok) {
    for (const message of config.errors) {
      console.error(message);
    }
    return 1;
  }
  const file = resolveInside(config.value.dataDir, DATA_FILE_NAME);
  const text = await readTextBounded(file, MAX_DATA_BYTES);
  if (text === null) {
    console.log(`No ${DATA_FILE_NAME} yet: the server creates a version 2 store on its first start.`);
    return 0;
  }
  let store: AnyStore;
  try {
    store = JSON.parse(text) as AnyStore;
  } catch {
    console.error(`${DATA_FILE_NAME} is not JSON: this is damage, not an old version. Start the server to restore a verified backup.`);
    return 1;
  }
  if (store.schemaVersion === 2) {
    console.log(`${DATA_FILE_NAME} is already schemaVersion 2: nothing to migrate.`);
    return 0;
  }
  const result = dryRun(store);
  if (!result.ok) {
    console.error(`Dry run failed: ${result.problem}`);
    console.error(`${DATA_FILE_NAME} was not changed (schemaVersion ${JSON.stringify(store.schemaVersion)}).`);
    return 1;
  }
  const quarantined = result.quarantined.length;
  console.log(`Dry run: ${result.count} kept + ${quarantined} quarantined = ${expenses(result.count + quarantined)}, the same ids and per-category totals; a second run changes nothing.`);
  if (quarantined > 0) {
    const quarantineFile = resolveInside(config.value.dataDir, QUARANTINE_FILE_NAME);
    const shown = shownPath(quarantineFile);
    if (await exists(quarantineFile)) {
      console.error(`${shown} already exists and may hold records nobody has repaired yet: it is never overwritten.`);
      console.error(`Move it somewhere else and run "npm run migrate" again. ${DATA_FILE_NAME} was not changed.`);
      return 1;
    }
    // The quarantine first: if the process dies before the store is replaced, the store is still version 1, whole.
    await writeAtomic(quarantineFile, quarantineText(result.quarantined));
    const ids = result.quarantined.map((one) => `${String((one.record as { id?: unknown })?.id)} (${one.problems.join(", ")})`);
    console.log(`Quarantined ${expenses(quarantined)} in ${shown}: ${ids.join("; ")}`);
  }
  await writeAtomic(file, JSON.stringify(result.result, null, 2) + "\n");
  console.log(`Migrated ${DATA_FILE_NAME} to schemaVersion 2: ${expenses(result.count)} kept, ${quarantined} quarantined.`);
  return 0;
}

process.exitCode = await main();
