import { test, expect } from "./testing.js";
import { completedSince } from "./habits.js";

const habit = { id: "h-01", name: "%%h01%%", frequency: "daily", active: true, completions: ["2026-02-27", "2026-02-28", "2026-03-01"] };

test("%%tNone%%", () => {
  expect(completedSince(habit, "2026-03-05"), "%%mNone%%").toBe(0);
});

test("%%tBackfill%%", () => {
  const copy = { ...habit, completions: [...habit.completions, "2026-02-20"] };
  expect(completedSince(copy, "2026-02-20"), "%%mBackfill%%").toBe(4);
});

test("%%tEverything%%", () => {
  expect(completedSince(habit, "2026-01-01"), "%%mEverything%%").toBe(3);
});

// Bug report: "A completion on the first day of the period is not counted."
test("%%tReport%%", () => {
  expect(completedSince(habit, "2026-03-01"), "%%mReport%%").toBe(1);
});
