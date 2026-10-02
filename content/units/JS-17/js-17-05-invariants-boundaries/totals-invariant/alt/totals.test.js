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

test("%%tEmpty%%", () => {
  const totals = buildTotals([]);
  assertInvariant(totals);
  expect(totals.overall, "%%mOverall%%").toBe(0);
  expect(totals.records.size, "%%mSize%%").toBe(0);
});

test("%%tSingle%%", () => {
  const totals = buildTotals([fixtures[1]]);
  assertInvariant(totals);
  expect(totals.overall, "%%mOverall%%").toBe(52000);
});

test("%%tDuplicate%%", () => {
  const totals = buildTotals(fixtures);
  expect(() => addExpense(totals, { ...fixtures[0], amountMinor: 100 }), "%%mDuplicate%%").toThrow(Error);
  assertInvariant(totals);
  expect(totals.overall, "%%mOverall%%").toBe(157600);
});

test("%%tMax%%", () => {
  const many = [];
  for (let i = 0; i < 10000; i++) {
    many.push({ id: "e-" + i, label: "%%lunch%%", amountMinor: 100, date: "2026-03-02", category: i % 2 === 0 ? "food" : "fun" });
  }
  const totals = buildTotals(many);
  assertInvariant(totals);
  expect([totals.records.size, totals.overall], "%%mSize%%").toEqual([10000, 1000000]);
});
