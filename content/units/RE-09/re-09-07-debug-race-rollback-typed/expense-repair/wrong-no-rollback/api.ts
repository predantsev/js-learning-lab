import { getJson, putAmount } from "./fixtureServer";
import { parseExpenseList } from "./expenseModel";
import type { ParseResult } from "./expenseModel";
import type { Expense } from "./expenses";

// Every answer of the server enters the app here.
export async function loadExpenses(): Promise<ParseResult<Expense[]>> {
  return parseExpenseList(await getJson());
}

export function saveAmount(id: string, amountMinor: number, delayMs: number, fail: boolean): Promise<void> {
  return putAmount(id, amountMinor, delayMs, fail);
}
