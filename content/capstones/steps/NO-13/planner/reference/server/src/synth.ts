// Writes N synthetic tasks as JSON lines to the standard output: `npm run -s synth -- 10000 > data/import.jsonl`
// in server/. The tasks come from the web project's makeSyntheticTasks (the same count always gives the
// same list) with ids t-101, t-102, … that do not clash with the starting ones. The output is written with
// backpressure: when the terminal or the file cannot keep up, write() answers false and the script waits
// for 'drain' instead of piling the lines up in memory.
import { makeSyntheticTasks } from "../../data/synthetic.js";
import type { Task } from "../../domain/tasks.ts";
import { taskLine, writeJsonLines } from "./jsonl.ts";

const count = Number(process.argv[2] ?? "10000");
if (!Number.isInteger(count) || count < 1 || count > 100_000) {
  console.error("Usage: npm run -s synth -- <count from 1 to 100000> > file.jsonl");
  process.exitCode = 1;
} else {
  // tsc reads the priorities of the JavaScript generator as any text; they are the three known ones.
  const tasks: Task[] = (makeSyntheticTasks(count) as Task[]).map((task, index) => ({ ...task, id: `t-${101 + index}` }));
  await writeJsonLines(tasks.map(taskLine), process.stdout);
}
