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

test("%%tLateFailure%%", () => {
  const state = ready(21050);
  expect(subject.expensesReducer(state, { type: "loadFailed", message: "503" })).toBe(state);
  expect(subject.expensesReducer({ status: "loading" }, { type: "loadFailed", message: "503" })).toEqual({ status: "failed", message: "503" });
});

test("%%tOlderFails%%", () => {
  let state = ready(21050);
  state = subject.expensesReducer(state, { type: "editStarted", id: "e-06", amountMinor: 25000, mutation: 1 });
  state = subject.expensesReducer(state, { type: "editStarted", id: "e-06", amountMinor: 30000, mutation: 2 });
  state = subject.expensesReducer(state, { type: "editConfirmed", id: "e-06", mutation: 2 });
  state = subject.expensesReducer(state, { type: "editFailed", id: "e-06", mutation: 1, previousAmount: 21050 });
  expect(state.status === "ready" ? state.expenses[0].amountMinor : null).toBe(30000);
});
