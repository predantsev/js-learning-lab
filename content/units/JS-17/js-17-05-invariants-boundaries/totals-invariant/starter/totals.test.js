import { test, expect } from "./testing.js";
import { buildTotals, addExpense } from "./totals.js";
import { assertInvariant } from "./invariant.js";

const fixtures = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
  { id: "e-02", label: "%%pass%%", amountMinor: 52000, date: "2026-03-01", category: "transport" },
  { id: "e-06", label: "%%lunch%%", amountMinor: 21050, date: "2026-03-02", category: "food" },
];

test("%%tTypical%%", () => {
  const totals = buildTotals(fixtures);
  assertInvariant(totals);
  expect(totals.byCategory.get("food"), "%%mFood%%").toBe(105600);
});

// Add boundary tests: no expenses, one expense, adding an expense whose id is already there,
// and 10,000 expenses. After every operation call assertInvariant.
