// Marks one stored task as done: `npm run complete -- t-01` (or `node src/complete-task.ts t-01`) in
// server/, with TODAY in the environment as for every script. The change is saved through writeAtomic.
// With CRASH_BEFORE_RENAME=1 the process is killed between the temp-file write and the rename — the
// crash rehearsal of this step.
import { loadConfig, requireToday } from "./config.ts";
import { initStore } from "./open.ts";

async function main(): Promise<number> {
  const config = loadConfig(process.env);
  if (!config.ok) {
    for (const message of config.errors) {
      console.error(message);
    }
    return 1;
  }
  if (requireToday(config.value) === null) {
    return 1;
  }
  const id = process.argv[2];
  if (id === undefined) {
    console.error("Usage: node src/complete-task.ts <task id>, for example t-01");
    return 1;
  }
  try {
    const { repository } = await initStore(config.value);
    const task = await repository.get(id);
    if (task === null) {
      console.error(`No task with the id "${id}"`);
      return 1;
    }
    await repository.save({ ...task, done: true });
    console.log(`Saved: ${id} is done`);
    return 0;
  } catch (error) {
    console.error(`Cannot save: ${(error as Error).message}`);
    return 1;
  }
}

process.exitCode = await main();
