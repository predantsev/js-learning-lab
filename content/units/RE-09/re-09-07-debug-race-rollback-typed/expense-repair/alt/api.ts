import { getJson, putAmount } from "./fixtureServer";
import { parseExpense } from "./expenseModel";
import type { ParseResult } from "./expenseModel";
import type { Expense } from "./expenses";

// Every answer of the server enters the app here.
export async function loadExpenses(): Promise<ParseResult<Expense[]>> {
  const body: unknown = await getJson();
  if (!Array.isArray(body)) return { ok: false, errors: { list: "notArray" } };
  const expenses: Expense[] = [];
  for (const [index, item] of body.entries()) {
    const result = parseExpense(item);
    if (!result.ok) return { ok: false, errors: { [String(index)]: Object.keys(result.errors).join(",") } };
    expenses.push(result.value);
  }
  return { ok: true, value: expenses };
}

export function saveAmount(id: string, amountMinor: number, delayMs: number, fail: boolean): Promise<void> {
  return putAmount(id, amountMinor, delayMs, fail);
}
