// Tests of the CP-RN enhancement's rule (src/summary.ts) under the course runner.
import { test, expect } from "./testing.js";
import { monthSummary, monthsOf } from "../src/summary.ts";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";

const expenses = [
  { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
  { id: "e-04", label: "%%fixture4Name%%", amountMinor: 9990, date: "2026-02-27", category: "home" },
  { id: "e-05", label: "%%fixture5Name%%", amountMinor: 30000, date: "2026-02-27", category: "fun" },
];

test("the months with expenses, the latest first, and one month's totals in whole kopiykas", () => {
  expect(monthsOf(expenses), "months").toEqual(["2026-03", "2026-02"]);
  const february = monthSummary(expenses, "2026-02", null);
  expect(february.summary, "February").toEqual({ total: 39990, byCategory: { food: 0, transport: 0, home: 9990, fun: 30000 } });
  expect(monthSummary(expenses, "2026-02", "fun").shown.map((expense) => expense.id), "fun in February").toEqual(["e-05"]);
});

test("an expense removed offline and saved leaves the month's totals after a new read", async () => {
  const storage = createMemoryStorage();
  await createRepository(storage, expenses).apply({ type: "removed", id: "e-05" });
  const after = (await createRepository(storage, []).readAll()).records;
  expect(monthSummary(after, "2026-02", null).summary.total, "February after the change").toBe(9990);
});
