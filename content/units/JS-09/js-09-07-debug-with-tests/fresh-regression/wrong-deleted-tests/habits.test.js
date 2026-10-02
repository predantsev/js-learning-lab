import { test, expect } from "./testing.js";
import { completedSince } from "./habits.js";

function makeHabit() {
  return { id: "h-01", name: "%%h01%%", frequency: "daily", active: true, completions: ["2026-02-27", "2026-02-28", "2026-03-01"] };
}

test("%%tNone%%", () => {
  expect(completedSince(makeHabit(), "2026-03-05"), "%%mNone%%").toBe(0);
});

test("%%tEverything%%", () => {
  expect(completedSince(makeHabit(), "2026-01-01"), "%%mEverything%%").toBe(3);
});
