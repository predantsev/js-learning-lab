import { test, expect } from "./testing.js";
import { isOnOrAfter, totalSince } from "./expenses.js";

// Fresh expenses for every test.
function makeExpenses() {
  return [
    { id: "e-04", label: "%%e04%%", amountMinor: 9990, date: "2026-02-27", category: "home" },
    { id: "e-03", label: "%%e03%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
    { id: "e-01", label: "%%e01%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
    { id: "e-06", label: "%%e06%%", amountMinor: 21050, date: "2026-03-02", category: "food" },
  ];
}

test("%%t1%%", () => {
  expect(totalSince([], "2026-03-01"), "%%m1%%").toBe(0);
});

test("%%t2%%", () => {
  expect(totalSince(makeExpenses(), "2026-03-05"), "%%m2%%").toBe(0);
});

test("%%t3%%", () => {
  expect(totalSince(makeExpenses(), "2026-02-01"), "%%m3%%").toBe(133590);
});

test("%%t4%%", () => {
  expect(isOnOrAfter("2026-03-02", "2026-03-01"), "%%m4%%").toBe(true);
});

test("%%t5%%", () => {
  expect(isOnOrAfter("2026-02-28", "2026-03-01"), "%%m5%%").toBe(false);
});
