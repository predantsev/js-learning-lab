// Marks one stored wish as acquired: `npm run acquire -- w-02` (or `node src/acquire.ts w-02`) in
// server/. The change is saved through writeAtomic. With CRASH_BEFORE_RENAME=1 the process is killed
// between the temp-file write and the rename — the crash rehearsal of this step.
import { loadConfig } from "./config.ts";
import { initStore } from "./open.ts";

async function main(): Promise<number> {
  const config = loadConfig(process.env);
  if (!config.ok) {
    for (const message of config.errors) {
      console.error(message);
    }
    return 1;
  }
  const id = process.argv[2];
  if (id === undefined) {
    console.error("Usage: node src/acquire.ts <wish id>, for example w-02");
    return 1;
  }
  try {
    const { repository } = await initStore(config.value);
    const wish = await repository.get(id);
    if (wish === null) {
      console.error(`No wish with the id "${id}"`);
      return 1;
    }
    await repository.save({ ...wish, acquired: true });
    console.log(`Saved: ${id} is acquired`);
    return 0;
  } catch (error) {
    console.error(`Cannot save: ${(error as Error).message}`);
    return 1;
  }
}

process.exitCode = await main();
