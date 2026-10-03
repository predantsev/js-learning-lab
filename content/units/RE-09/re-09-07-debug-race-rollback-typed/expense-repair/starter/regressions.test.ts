import { test, expect } from "./testing";
import { subject } from "./subject";
import { GOOD, DAMAGED, setAnswer } from "./fixtureServer";
import type { Expense, ExpensesState } from "./expenses";

const lunch: Expense = { id: "e-06", label: "%%lunch%%", amountMinor: 21050, date: "2026-03-02" };
const ready = (amountMinor: number, confirmed: Record<string, number> = {}): ExpensesState => ({
  status: "ready",
  expenses: [{ ...lunch, amountMinor }],
  confirmed,
});

test("%%tLoaded%%", () => {
  const next = subject.expensesReducer({ status: "loading" }, { type: "loaded", expenses: [lunch] });
  expect(next).toEqual(ready(21050));
});

// TODO: one regression test per seeded defect — each fails on the defect and passes after your fix:
//   1. a late loadFailed while the list is ready
//   2. a damaged server answer (setAnswer(DAMAGED), then subject.loadExpenses())
//   3. an older edit that fails after a newer edit of the same expense was confirmed
// After a test that changes the server answer, put the good one back: setAnswer(GOOD).
