// Characterization tests of the indexed version: it must give exactly what the slow version gave,
// on synthetic data and on small cases written by hand.
import { test, expect } from "./testing.js";
import { dailyTotals } from "../domain/expenses.ts";
import { makeSyntheticExpenses } from "../data/synthetic.js";

// The slow version, kept as the reference of the behaviour: for every date it filters the whole list
// again, so the work grows with dates × expenses.
function slowDailyTotals(list) {
  const days = [...new Set(list.map((expense) => expense.date))].sort();
  return new Map(days.map((day) => [day, list.filter((expense) => expense.date === day).reduce((sum, expense) => sum + expense.amountMinor, 0)]));
}

test("dailyTotals gives the same totals as the slow version on 600 synthetic expenses", () => {
  const list = makeSyntheticExpenses(600);
  expect([...dailyTotals(list)], "totals by day").toEqual([...slowDailyTotals(list)]);
});

test("dailyTotals adds up every expense of a day", () => {
  const list = [
    { id: "a", label: "%%fixture1Name%%", amountMinor: 100, date: "2026-03-02", category: "food" },
    { id: "b", label: "%%fixture2Name%%", amountMinor: 250, date: "2026-03-01", category: "fun" },
    { id: "c", label: "%%fixture3Name%%", amountMinor: 5, date: "2026-03-02", category: "home" },
  ];
  expect([...dailyTotals(list)], "totals by day").toEqual([["2026-03-01", 250], ["2026-03-02", 105]]);
});
