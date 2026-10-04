// The CP-RN enhancement of the expense tracker: a monthly summary — the months that have expenses, the
// totals of the shared summarizeExpenses for one month in whole kopiykas, and the expenses of that month
// in one category or in all. Pure: Node.js and Jest test it; the screen only shows it.
import { filterExpenses, summarizeExpenses } from "../domain/expenses.ts";
import type { CategoryId, Expense, ExpenseSummary } from "../domain/expenses.ts";

// "YYYY-MM" of every month with an expense, the latest first.
export function monthsOf(expenses: Expense[]): string[] {
  return [...new Set(expenses.map((expense) => expense.date.slice(0, 7)))].sort().reverse();
}

export function monthSummary(expenses: Expense[], month: string, category: CategoryId | null): { summary: ExpenseSummary; shown: Expense[] } {
  const inMonth = expenses.filter((expense) => expense.date.slice(0, 7) === month);
  return { summary: summarizeExpenses(inMonth), shown: category === null ? inMonth : filterExpenses(inMonth, category) };
}
