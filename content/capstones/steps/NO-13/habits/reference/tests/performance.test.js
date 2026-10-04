// Characterization tests of the indexed version: it must give exactly what the slow version gave,
// on synthetic data and on small cases written by hand.
import { test, expect } from "./testing.js";
import { summarizeHabit } from "../domain/habits.ts";
import { makeSyntheticHabits, dayAfterStart } from "../data/synthetic.js";

// The slow version, kept as the reference of the behaviour: for every day it looks through all the
// completions (includes), so the work grows with days × completions.
function slowSummarizeHabit(habit, days) {
  const count = days.filter((day) => habit.completions.includes(day)).length;
  return { count: count, rate: days.length === 0 ? 0 : count / days.length };
}

test("summarizeHabit gives the same result as the slow version on synthetic habits", () => {
  const days = Array.from({ length: 200 }, (_, offset) => dayAfterStart(offset + 100));
  for (const habit of makeSyntheticHabits(3, 400)) {
    expect(summarizeHabit(habit, days), "the summary of " + habit.id).toEqual(slowSummarizeHabit(habit, days));
  }
});

test("summarizeHabit counts only the completions inside the days", () => {
  const habit = { id: "h", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-20", "2026-03-01", "2026-03-02"] };
  expect(summarizeHabit(habit, ["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-04"]), "two of four days").toEqual({ count: 2, rate: 0.5 });
});
