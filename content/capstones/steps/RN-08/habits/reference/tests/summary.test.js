// Tests of the CP-RN enhancement's rule (src/summary.ts) under the course runner.
import { test, expect } from "./testing.js";
import { lastDays, weekRow } from "../src/summary.ts";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";

const habit = { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-22", "2026-02-27", "2026-03-01"] };

test("seven days end on the given day, also across the end of a month", () => {
  expect(lastDays("2026-03-02", 7), "the week").toEqual(["2026-02-24", "2026-02-25", "2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
});

test("the grid and the rate count only the seven days", () => {
  const row = weekRow(habit, "2026-03-02");
  expect(row.cells.filter((cell) => cell.done).map((cell) => cell.day), "done days").toEqual(["2026-02-27", "2026-03-01"]);
  expect(row.rate, "2 of 7").toBe(2 / 7);
});

test("a day marked offline and saved is in the grid after a new read", async () => {
  const storage = createMemoryStorage();
  await createRepository(storage, [habit]).apply({ type: "completionAdded", id: "h-01", day: "2026-03-02" });
  const after = (await createRepository(storage, []).readAll()).records;
  expect(weekRow(after[0], "2026-03-02").rate, "3 of 7").toBe(3 / 7);
});
