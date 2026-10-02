import { test, expect } from "./testing.js";
import { buildHabitReport, mergeCompletions } from "./report.js";
import { categoriesById } from "./data.js";

// The storage is replaced by a stub: it returns completions that are already sorted.
const storageStub = { loadCompletions: () => ["2026-02-27", "2026-02-28", "2026-03-01"] };

test("%%tStreakStub%%", () => {
  const habit = { id: "h-01", name: "%%habit%% 1", categoryId: "c-sport", completions: storageStub.loadCompletions() };
  const report = buildHabitReport(habit, categoriesById, ["2026-02-28", "2026-03-01"], "2026-03-01");
  expect(report.streak, "%%mStreak%%").toBe(3);
});

// No stub: the real merge of this device's completions and an imported file with an older day.
test("%%tStreakMerged%%", () => {
  const merged = mergeCompletions(["2026-02-27", "2026-02-28", "2026-03-01"], ["2026-02-28", "2026-02-20"]);
  const habit = { id: "h-01", name: "%%habit%% 1", categoryId: "c-sport", completions: merged };
  expect(merged, "%%mMerged%%").toEqual(["2026-02-20", "2026-02-27", "2026-02-28", "2026-03-01"]);
  expect(buildHabitReport(habit, categoriesById, ["2026-02-28", "2026-03-01"], "2026-03-01").streak, "%%mStreak%%").toBe(3);
});
