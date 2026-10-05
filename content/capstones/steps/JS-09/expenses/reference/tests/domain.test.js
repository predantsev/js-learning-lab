// Tests of the expense rules in domain/expenses.js. Only pure functions are tested here: no page
// and no storage, so the same file also runs under Node.js.
import { test, expect } from "./testing.js";
import { validateExpense, summarizeExpenses, filterExpenses, sortExpenses } from "../domain/expenses.js";

// A fresh list for every test, so a test that changes it cannot change another test's data.
// Amounts are whole kopiykas (amountMinor).
function sampleExpenses() {
  return [
    { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
    { id: "e-02", label: "%%fixture2Name%%", amountMinor: 52000, date: "2026-02-27", category: "transport" },
    { id: "e-03", label: "%%fixture3Name%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
    { id: "e-04", label: "%%fixture4Name%%", amountMinor: 9990, date: "2026-03-02", category: "home" },
    { id: "e-06", label: "%%fixture6Name%%", amountMinor: 21050, date: "2026-02-26", category: "food" },
  ];
}

test("validateExpense accepts a label of 80 characters", () => {
  expect(validateExpense({ label: "a".repeat(80), amountMinor: 100, date: "2026-03-01", category: "food" }).ok, "80 characters").toBe(true);
});

test("validateExpense rejects a label of 81 characters", () => {
  expect(validateExpense({ label: "a".repeat(81), amountMinor: 100, date: "2026-03-01", category: "food" }), "81 characters").toEqual({ ok: false, errors: { label: "too-long" } });
});

test("validateExpense rejects an amount of 0 and of 99.5, and accepts 1", () => {
  const draft = (amountMinor) => ({ label: "%%fixture1Name%%", amountMinor: amountMinor, date: "2026-03-01", category: "food" });
  expect(validateExpense(draft(0)), "amountMinor 0").toEqual({ ok: false, errors: { amountMinor: "not-positive-integer" } });
  expect(validateExpense(draft(99.5)), "amountMinor 99.5").toEqual({ ok: false, errors: { amountMinor: "not-positive-integer" } });
  expect(validateExpense(draft(1)).ok, "amountMinor 1").toBe(true);
});

test("summarizeExpenses adds up every category and the total", () => {
  // food = 84550 + 21050 = 105600
  expect(summarizeExpenses(sampleExpenses()), "totals of the sample").toEqual({
    total: 185590,
    byCategory: { food: 105600, transport: 52000, home: 9990, fun: 18000 },
  });
});

test("summarizeExpenses of an empty list is all zeros", () => {
  expect(summarizeExpenses([]), "totals of []").toEqual({ total: 0, byCategory: { food: 0, transport: 0, home: 0, fun: 0 } });
});

test("filterExpenses keeps only the expenses of the category", () => {
  expect(filterExpenses(sampleExpenses(), "food").map((expense) => expense.id), "food").toEqual(["e-01", "e-06"]);
  expect(filterExpenses(sampleExpenses(), "home").map((expense) => expense.id), "home").toEqual(["e-04"]);
});

test("sortExpenses sorts by amount and by date", () => {
  const list = sampleExpenses();
  expect(sortExpenses(list, "amountMinor").map((expense) => expense.id), "by amountMinor").toEqual(["e-04", "e-03", "e-06", "e-02", "e-01"]);
  expect(sortExpenses(list, "date").map((expense) => expense.id), "by date").toEqual(["e-06", "e-02", "e-03", "e-01", "e-04"]);
  expect(list.map((expense) => expense.id), "the list passed in").toEqual(["e-01", "e-02", "e-03", "e-04", "e-06"]);
});
