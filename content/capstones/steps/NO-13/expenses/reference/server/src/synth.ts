// Writes N synthetic expenses as JSON lines to the standard output: `npm run -s synth -- 10000 > data/import.jsonl`
// in server/. The expenses come from the web project's makeSyntheticExpenses (the same count always gives the
// same list) with ids e-101, e-102, … that do not clash with the starting ones. The output is written with
// backpressure: when the terminal or the file cannot keep up, write() answers false and the script waits
// for 'drain' instead of piling the lines up in memory.
import { makeSyntheticExpenses } from "../../data/synthetic.js";
import type { CategoryId, Expense } from "../../domain/expenses.ts";
import { expenseLine, writeJsonLines } from "./jsonl.ts";

const count = Number(process.argv[2] ?? "10000");
if (!Number.isInteger(count) || count < 1 || count > 100_000) {
  console.error("Usage: npm run -s synth -- <count from 1 to 100000> > file.jsonl");
  process.exitCode = 1;
} else {
  // The generator is plain JavaScript, so tsc sees its category as any text; it yields only the four
  // categories of the project, and the import checks every line again anyway.
  const expenses: Expense[] = makeSyntheticExpenses(count).map((expense, index) => ({ ...expense, id: `e-${101 + index}`, category: expense.category as CategoryId }));
  await writeJsonLines(expenses.map(expenseLine), process.stdout);
}
