// Tests of the habit rules in domain/habits.js. Only pure functions are tested here: no page and
// no storage, so the same file also runs under Node.js.
import { test, expect } from "./testing.js";
import { validateHabit, summarizeHabit, filterHabits, sortHabitsByName, completeHabit, isCalendarDate, searchKey, searchHabits, indexById } from "../domain/habits.js";

// The days are fixed: the four days up to "today" = 2026-03-01. A test must not depend on the day
// it runs.
const DAYS = ["2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01"];

// A fresh habit for every call, so a test that changes it cannot change another test's data.
function habit(id, name, completions, active = true) {
  return { id: id, name: name, frequency: "daily", active: active, completions: completions };
}

test("validateHabit accepts a name of 80 characters", () => {
  expect(validateHabit({ name: "a".repeat(80), frequency: "daily" }).ok, "80 characters").toBe(true);
});

test("validateHabit rejects a name of 81 characters", () => {
  expect(validateHabit({ name: "a".repeat(81), frequency: "daily" }), "81 characters").toEqual({ ok: false, errors: { name: "too-long" } });
});

test("validateHabit rejects an unknown frequency", () => {
  expect(validateHabit({ name: "%%fixture1Name%%", frequency: "monthly" }), "frequency monthly").toEqual({ ok: false, errors: { frequency: "unknown" } });
});

test("summarizeHabit counts only the completions on the given days", () => {
  // 2026-02-20 is before the first day, so it is not counted.
  const result = summarizeHabit(habit("h-01", "Alpha", ["2026-02-20", "2026-02-27", "2026-03-01"]), DAYS);
  expect(result, "two of the four days").toEqual({ count: 2, rate: 0.5 });
});

test("summarizeHabit of a habit without completions is 0", () => {
  expect(summarizeHabit(habit("h-06", "Bravo", []), DAYS), "no completions").toEqual({ count: 0, rate: 0 });
});

test("summarizeHabit with no days gives a rate of 0, not NaN", () => {
  expect(summarizeHabit(habit("h-02", "Charlie", ["2026-03-01"]), []), "no days").toEqual({ count: 0, rate: 0 });
});

test("filterHabits keeps only the active or only the paused habits", () => {
  const list = [habit("h-01", "Alpha", []), habit("h-05", "Echo", [], false)];
  expect(filterHabits(list, "active").map((one) => one.id), "active").toEqual(["h-01"]);
  expect(filterHabits(list, "paused").map((one) => one.id), "paused").toEqual(["h-05"]);
});

test("sortHabitsByName puts the names in alphabetical order", () => {
  const list = [habit("h-03", "Charlie", []), habit("h-01", "Alpha", []), habit("h-02", "Bravo", [])];
  expect(sortHabitsByName(list).map((one) => one.name), "sorted names").toEqual(["Alpha", "Bravo", "Charlie"]);
  expect(list.map((one) => one.id), "the list passed in").toEqual(["h-03", "h-01", "h-02"]);
});

test("completeHabit keeps the dates unique and sorted", () => {
  const list = [{ id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-27", "2026-03-01"] }];
  expect(completeHabit(list, "h-01", "2026-02-28")[0].completions, "an earlier day").toEqual(["2026-02-27", "2026-02-28", "2026-03-01"]);
  expect(completeHabit(list, "h-01", "2026-03-01")[0].completions, "a day that is already there").toEqual(["2026-02-27", "2026-03-01"]);
  expect(completeHabit(list, "h-01", "2026-03-02T08:00")[0].completions, "a day with a time").toEqual(["2026-02-27", "2026-03-01"]);
  expect(isCalendarDate("1.03.2026"), "another date format").toBe(false);
});

test("searchKey gives the same key however the text was typed", () => {
  // The same word typed as one character per letter and with a letter + a combining mark.
  expect(searchKey("  %%unicodeWord%% "), "composed").toBe("%%unicodeKey%%");
  expect(searchKey("%%unicodeWordDecomposed%%"), "decomposed").toBe("%%unicodeKey%%");
});

test("searchHabits finds a habit whatever the case and the Unicode form", () => {
  const list = [
    { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: [] },
    { id: "h-02", name: "%%unicodeWord%%", frequency: "daily", active: true, completions: [] },
  ];
  expect(searchHabits(list, " %%unicodeQuery%% ").map((habit) => habit.id), "decomposed query").toEqual(["h-02"]);
  expect(indexById(list).get("h-02"), "the habit h-02 in the index").toBe(list[1]);
});
