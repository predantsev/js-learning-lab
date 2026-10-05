// Tests of the platform adapters (src/adapters.ts) and of the snapshot they save (src/snapshot.ts),
// and of "mark today" with a fixed clock. No React Native here, so Node.js runs them with `npm test`.
import { test, expect } from "./testing.js";
import { createFixedClock, createMemoryStorage, createSystemClock } from "../src/adapters.ts";
import { KEY, saveSnapshot } from "../src/snapshot.ts";
import { habitsReducer } from "../ui/habitsReducer.ts";

test("the memory storage gives back what was set and forgets what was removed", async () => {
  const storage = createMemoryStorage();
  expect(await storage.getItem("k"), "nothing saved yet").toBe(null);
  await storage.setItem("k", "text");
  expect(await storage.getItem("k"), "after setItem").toBe("text");
  await storage.removeItem("k");
  expect(await storage.getItem("k"), "after removeItem").toBe(null);
});

test("saveSnapshot writes { schemaVersion: 1, records } under the key of the React project", async () => {
  const storage = createMemoryStorage();
  const records = [{ id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-03-01"] }];
  await saveSnapshot(storage, records);
  expect(KEY, "the key").toBe("jsll.habits.v1");
  expect(JSON.parse(await storage.getItem(KEY)), "the saved snapshot").toEqual({ schemaVersion: 1, records: records });
});

test("the system clock gives a calendar date and the fixed clock always the same day", () => {
  expect(/^\d{4}-\d{2}-\d{2}$/.test(createSystemClock().today()), "system clock: " + createSystemClock().today()).toBe(true);
  const clock = createFixedClock("2026-03-02");
  expect(clock.today(), "first call").toBe("2026-03-02");
  expect(clock.today(), "second call").toBe("2026-03-02");
});

test("mark today adds the day of the clock once, in order, through completeHabit", () => {
  const today = createFixedClock("2026-03-02").today();
  const habits = [{ id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-28", "2026-03-01"] }];
  const next = habitsReducer(habits, { type: "completionAdded", id: "h-01", day: today });
  expect(next[0].completions, "after marking").toEqual(["2026-02-28", "2026-03-01", "2026-03-02"]);
  expect(habitsReducer(next, { type: "completionAdded", id: "h-01", day: today }), "marking again").toBe(next);
});
