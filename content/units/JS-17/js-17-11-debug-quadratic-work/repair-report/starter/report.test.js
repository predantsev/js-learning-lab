import { test, expect } from "./testing.js";
import { buildHabitReport } from "./report.js";
import { categoriesById } from "./data.js";

// The storage is replaced by a stub: it returns completions that are already sorted.
const storageStub = { loadCompletions: () => ["2026-02-27", "2026-02-28", "2026-03-01"] };

test("%%tStreakStub%%", () => {
  const habit = { id: "h-01", name: "%%habit%% 1", categoryId: "c-sport", completions: storageStub.loadCompletions() };
  const report = buildHabitReport(habit, categoriesById, ["2026-02-28", "2026-03-01"], "2026-03-01");
  expect(report.streak, "%%mStreak%%").toBe(3);
});

// Add a test without the stub: merge real local and imported completions with mergeCompletions,
// then check the streak of the merged list.
