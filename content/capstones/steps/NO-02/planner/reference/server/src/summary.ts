// The planner summary in the terminal: `npm run summary` (or `node src/summary.ts`) in server/, with
// TODAY=YYYY-MM-DD in the environment. It reads the stored tasks (server/data/; on the very first start the
// web project's starting tasks are stored there first). It checks the configuration first and stops with exit code 1
// when a value is invalid; a damaged data file also ends with a readable message and
// exit code 1, without a stack trace.
import { loadConfig } from "./config.ts";
import { openRepository } from "./open.ts";
import { countDueTasks, sortTasks } from "../../domain/tasks.ts";
import type { Task } from "../../domain/tasks.ts";

const TEXT = {
  uk: { due: "Невиконаних справ із терміном до", cannotRead: "Не вдалося прочитати збережені справи", removedTemp: "Видалено тимчасовий файл, що лишився після збою", seeded: "Створено файл даних зі стартовими справами" },
  en: { due: "Pending tasks due on or before", cannotRead: "Cannot read the stored tasks", removedTemp: "Removed a temp file left by a crash", seeded: "Created the data file with the starting tasks" },
};

// Returns the exit code: 0 when the summary was printed, 1 when it could not be.
async function main(): Promise<number> {
  const config = loadConfig(process.env);
  if (!config.ok) {
    for (const message of config.errors) {
      console.error(message);
    }
    return 1;
  }
  const { locale, today } = config.value;
  const text = TEXT[locale];

  // Only the loading is inside try: a mistake in the code below is not reported as a damaged file.
  let tasks: Task[];
  try {
    const opened = await openRepository(config.value);
    for (const name of opened.removedTemps) {
      console.log(`${text.removedTemp}: ${name}`);
    }
    if (opened.seeded) {
      console.log(`${text.seeded}: ${opened.repository.file}`);
    }
    tasks = await opened.repository.list();
  } catch (error) {
    console.error(`${text.cannotRead}: ${(error as Error).message}`);
    return 1;
  }

  // The same rule as countDueTasks: pending, with a due date, on or before the day.
  const due = sortTasks(tasks).filter((task) => !task.done && task.dueDate !== null && task.dueDate <= today);
  console.log(`${text.due} ${today}: ${countDueTasks(tasks, today)}`);
  for (const task of due) {
    console.log(`- ${task.title} (${task.dueDate})`);
  }
  return 0;
}

// process.exitCode, not process.exit(): Node finishes writing the output first.
process.exitCode = await main();
