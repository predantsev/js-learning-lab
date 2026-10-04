// Adds TODAY to the completions of one stored habit: `npm run complete -- h-03` (or
// `node src/complete-habit.ts h-03`) in server/, with TODAY in the environment. completeHabit of the
// domain keeps the dates unique and sorted, so a day that is already there changes nothing and nothing is
// written. The change is saved through writeAtomic; with CRASH_BEFORE_RENAME=1 the process is killed
// between the temp-file write and the rename — the crash rehearsal of this step.
import { loadConfig, requireToday } from "./config.ts";
import { initStore } from "./open.ts";
import { completeHabit } from "../../domain/habits.ts";

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
    console.error("Usage: node src/complete-habit.ts <habit id>, for example h-03");
    return 1;
  }
  const today = requireToday(config.value);
  if (today === null) {
    return 1;
  }
  try {
    const { repository } = await initStore(config.value);
    const habit = await repository.get(id);
    if (habit === null) {
      console.error(`No habit with the id "${id}"`);
      return 1;
    }
    const [changed] = completeHabit([habit], id, today);
    if (changed === habit) {
      console.log(`Nothing to save: ${id} already has ${today}`);
      return 0;
    }
    await repository.save(changed);
    console.log(`Saved: ${id} completed on ${today}`);
    return 0;
  } catch (error) {
    console.error(`Cannot save: ${(error as Error).message}`);
    return 1;
  }
}

process.exitCode = await main();
