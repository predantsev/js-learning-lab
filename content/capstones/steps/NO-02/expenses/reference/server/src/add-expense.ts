// Adds one expense to the stored list: `npm run add -- "<label>" <amountMinor> <category> <date>`, for
// example `npm run add -- "Кава" 6500 food 2026-03-02` (6500 kopiykas = 65,00 ₴) in server/. The amount is
// a whole number of kopiykas; validateExpense of the domain checks every field. The change is saved
// through writeAtomic; with CRASH_BEFORE_RENAME=1 the process is killed between the temp-file write and
// the rename — the crash rehearsal of this step.
import { loadConfig } from "./config.ts";
import { openRepository } from "./open.ts";
import { validateExpense } from "../../domain/expenses.ts";
import type { Expense } from "../../domain/expenses.ts";

// The next free id: one more than the biggest number among the ids "e-NN", written with two digits.
function nextId(expenses: Expense[]): string {
  let biggest = 0;
  for (const expense of expenses) {
    const number = Number(expense.id.slice(2));
    if (expense.id.startsWith("e-") && Number.isInteger(number) && number > biggest) {
      biggest = number;
    }
  }
  return "e-" + String(biggest + 1).padStart(2, "0");
}

async function main(): Promise<number> {
  const config = loadConfig(process.env);
  if (!config.ok) {
    for (const message of config.errors) {
      console.error(message);
    }
    return 1;
  }
  const [label, amountText, category, date] = process.argv.slice(2);
  // Digits only: Number("1e3") would give 1000, and Number("") would give 0.
  const amountMinor = amountText !== undefined && /^\d+$/.test(amountText) ? Number(amountText) : NaN;
  const check = validateExpense({ label: label, amountMinor: amountMinor, category: category, date: date });
  if (!check.ok) {
    console.error(`Invalid expense: ${JSON.stringify(check.errors)}`);
    console.error('Usage: node src/add-expense.ts "<label>" <amountMinor> <food|transport|home|fun> <YYYY-MM-DD>');
    return 1;
  }
  try {
    const { repository } = await openRepository(config.value);
    const id = nextId(await repository.list());
    await repository.save({ id: id, ...check.value });
    console.log(`Saved: ${id}, ${check.value.amountMinor} kopiykas, ${check.value.category}`);
    return 0;
  } catch (error) {
    console.error(`Cannot save: ${(error as Error).message}`);
    return 1;
  }
}

process.exitCode = await main();
