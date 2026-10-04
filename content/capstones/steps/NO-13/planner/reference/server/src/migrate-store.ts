// Moves the stored tasks from schemaVersion 1 to 2: `npm run migrate` in server/, with the server
// stopped. First a dry run on a copy in memory (the count, the ids and the pending-due count for TODAY —
// or the local day when TODAY is not set — stay the same, a second run changes nothing); only then the live file is replaced in one atomic step, in which
// version 2 appears together with the moved records. When the dry run fails, the file is not touched
// and stays on version 1, whole.
import { loadConfig } from "./config.ts";
import { DATA_FILE_NAME, MAX_DATA_BYTES } from "./fileRepository.ts";
import { readTextBounded, resolveInside, writeAtomic } from "./files.ts";
import { dryRun } from "./migrate.ts";
import { dayOf } from "./open.ts";
import type { AnyStore } from "./migrate.ts";

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
  const day = dayOf(config.value);
  const result = dryRun(store, day);
  if (!result.ok) {
    console.error(`Dry run failed: ${result.problem}`);
    console.error(`${DATA_FILE_NAME} was not changed (schemaVersion ${JSON.stringify(store.schemaVersion)}).`);
    return 1;
  }
  console.log(`Dry run: ${result.count} tasks, the same ids and pending-due count for ${day}; a second run changes nothing.`);
  await writeAtomic(file, JSON.stringify(result.result, null, 2) + "\n");
  console.log(`Migrated ${DATA_FILE_NAME} to schemaVersion 2: ${result.count} tasks.`);
  return 0;
}

process.exitCode = await main();
