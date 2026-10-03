import { getJson, putAmount } from "./fixtureServer";
import { toExpense } from "./expenseModel";
import type { ApiExpense, ParseResult } from "./expenseModel";
import type { Expense } from "./expenses";

// Every answer of the server enters the app here.
export async function loadExpenses(): Promise<ParseResult<Expense[]>> {
  const body = await getJson();
  return { ok: true, value: (body as ApiExpense[]).map(toExpense) };
}

export function saveAmount(id: string, amountMinor: number, delayMs: number, fail: boolean): Promise<void> {
  return putAmount(id, amountMinor, delayMs, fail);
}
