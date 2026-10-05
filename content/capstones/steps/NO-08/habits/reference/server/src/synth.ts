// Writes N synthetic habits as JSON lines to the standard output: `npm run -s synth -- 10000 > data/import.jsonl`
// in server/ (a second number sets the days of completions, 30 by default). The habits come from the web
// project's makeSyntheticHabits (the same count and days always give the same list) with ids h-101,
// h-102, … that do not clash with the starting ones. The days stay at most MAX_COMPLETIONS, so every habit
// passes the import's edge rules. The output is written with backpressure: when the terminal or the file
// cannot keep up, write() answers false and the script waits for 'drain' instead of piling the lines up in
// memory.
import { makeSyntheticHabits } from "../../data/synthetic.js";
import type { Habit } from "../../domain/habits.ts";
import { habitLine, writeJsonLines } from "./jsonl.ts";
import { MAX_COMPLETIONS } from "./validate.ts";

const count = Number(process.argv[2] ?? "10000");
const days = Number(process.argv[3] ?? "30");
if (!Number.isInteger(count) || count < 1 || count > 100_000 || !Number.isInteger(days) || days < 1 || days > MAX_COMPLETIONS) {
  console.error(`Usage: npm run -s synth -- <count from 1 to 100000> [days from 1 to ${MAX_COMPLETIONS}] > file.jsonl`);
  process.exitCode = 1;
} else {
  // tsc reads the frequency of the .js generator as any text; every one is "daily", so the list is a Habit[].
  const habits: Habit[] = (makeSyntheticHabits(count, days) as Habit[]).map((habit, index) => ({ ...habit, id: `h-${101 + index}` }));
  await writeJsonLines(habits.map(habitLine), process.stdout);
}
