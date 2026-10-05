// Tests of the streak in ui/streak.ts. They run with `npm test` (Node.js strips the types).
import { test, expect } from "./testing.js";
import { previousDay, streakOf } from "../ui/streak.ts";

test("previousDay crosses the end of a month and of a year", () => {
  expect(previousDay("2026-03-01"), "before 1 March").toBe("2026-02-28");
  expect(previousDay("2026-01-01"), "before 1 January").toBe("2025-12-31");
});

test("streakOf counts the days in a row up to today, or up to yesterday while today is not done", () => {
  expect(streakOf(["2026-02-28", "2026-03-01", "2026-03-02"], "2026-03-02"), "three days up to today").toBe(3);
  expect(streakOf(["2026-02-28", "2026-03-01"], "2026-03-02"), "today not done yet").toBe(2);
  expect(streakOf(["2026-02-27", "2026-03-01"], "2026-03-02"), "a gap ends the streak").toBe(1);
  expect(streakOf([], "2026-03-02"), "no completions").toBe(0);
  expect(streakOf(["2026-02-28"], "2026-03-02"), "nothing yesterday or today").toBe(0);
});
