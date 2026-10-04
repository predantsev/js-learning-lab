// The expense summary in the terminal: `npm run summary` (or `node src/summary.ts`) in server/. The
// totals are computed by summarizeExpenses in whole kopiykas; formatMoney turns them into text only for
// the output. The configuration is checked first; an invalid value or a damaged fixtures file ends with
// a readable message and exit code 1, without a stack trace.
import { loadConfig } from "./config.ts";
import { loadFixtures, FIXTURES_FILE } from "./fixtures.ts";
import { categoryName, formatMoney } from "./format.ts";
import { summarizeExpenses } from "../../domain/expenses.ts";
import type { CategoryId, Expense } from "../../domain/expenses.ts";

const CATEGORIES: CategoryId[] = ["food", "transport", "home", "fun"];

const TEXT = {
  uk: { total: "Разом", cannotRead: "Не вдалося прочитати" },
  en: { total: "Total", cannotRead: "Cannot read" },
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
  const text = TEXT[locale];

  // Only the loading is inside try: a mistake in the code below is not reported as a damaged file.
  let expenses: Expense[];
  try {
    expenses = await loadFixtures();
  } catch (error) {
    console.error(`${text.cannotRead} ${FIXTURES_FILE}: ${(error as Error).message}`);
    return 1;
  }

  const summary = summarizeExpenses(expenses);
  for (const category of CATEGORIES) {
    console.log(`${categoryName(category, locale)}: ${formatMoney(summary.byCategory[category], locale)}`);
  }
  console.log(`${text.total}: ${formatMoney(summary.total, locale)}`);
  return 0;
}

// process.exitCode, not process.exit(): Node finishes writing the output first.
process.exitCode = await main();
