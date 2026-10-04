// The habit summary in the terminal: `npm run summary` (or `node src/summary.ts`) in server/, with
// TODAY=YYYY-MM-DD in the environment. It reads the stored habits (server/data/; on the very first start the
// web project's starting habits are stored there first). For every active habit it prints how many completions it has up
// to that day and its streak from ui/streak.ts — the function the web app uses. The configuration is
// checked first; an invalid value or a damaged data file ends with a readable message and exit
// code 1, without a stack trace.
import { loadConfig, requireToday } from "./config.ts";
import { openRepository } from "./open.ts";
import { filterHabits } from "../../domain/habits.ts";
import type { Habit } from "../../domain/habits.ts";
import { streakOf } from "../../ui/streak.ts";

const TEXT = {
  uk: { heading: "Активні звички станом на", completions: "виконань", streak: "серія", cannotRead: "Не вдалося прочитати збережені звички", removedTemp: "Видалено тимчасовий файл, що лишився після збою", seeded: "Створено файл даних зі стартовими звичками" },
  en: { heading: "Active habits as of", completions: "completions", streak: "streak", cannotRead: "Cannot read the stored habits", removedTemp: "Removed a temp file left by a crash", seeded: "Created the data file with the starting habits" },
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
  const { locale } = config.value;
  const today = requireToday(config.value);
  if (today === null) {
    return 1;
  }
  const text = TEXT[locale];

  // Only the loading is inside try: a mistake in the code below is not reported as a damaged file.
  let habits: Habit[];
  try {
    const opened = await openRepository(config.value);
    for (const name of opened.removedTemps) {
      console.log(`${text.removedTemp}: ${name}`);
    }
    if (opened.seeded) {
      console.log(`${text.seeded}: ${opened.repository.file}`);
    }
    habits = await opened.repository.list();
  } catch (error) {
    console.error(`${text.cannotRead}: ${(error as Error).message}`);
    return 1;
  }

  const active = filterHabits(habits, "active");
  console.log(`${text.heading} ${today}: ${active.length}`);
  for (const habit of active) {
    const done = habit.completions.filter((day) => day <= today);
    console.log(`- ${habit.name}: ${text.completions} ${done.length}, ${text.streak} ${streakOf(done, today)}`);
  }
  return 0;
}

// process.exitCode, not process.exit(): Node finishes writing the output first.
process.exitCode = await main();
