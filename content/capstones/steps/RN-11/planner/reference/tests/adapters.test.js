// Tests of the platform adapters (src/adapters.ts) and of the snapshot they save (src/snapshot.ts).
// No React Native here, so Node.js runs them with `npm test`.
import { test, expect } from "./testing.js";
import { createDateFormat, createFixedClock, createMemoryStorage, createSystemClock } from "../src/adapters.ts";
import { countDueTasks } from "../domain/tasks.ts";
import { KEY, saveSnapshot } from "../src/snapshot.ts";

test("the memory storage gives back what was set and forgets what was removed", async () => {
  const storage = createMemoryStorage();
  expect(await storage.getItem("k"), "nothing saved yet").toBe(null);
  await storage.setItem("k", "text");
  expect(await storage.getItem("k"), "after setItem").toBe("text");
  expect(await createMemoryStorage().getItem("k"), "a second storage keeps its own data").toBe(null);
  await storage.removeItem("k");
  expect(await storage.getItem("k"), "after removeItem").toBe(null);
});

test("saveSnapshot writes { schemaVersion: 1, records } under the key of the React project", async () => {
  const storage = createMemoryStorage();
  const records = [{ id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-02", done: false, priority: "normal" }];
  await saveSnapshot(storage, records);
  expect(KEY, "the key").toBe("jsll.planner.v1");
  expect(JSON.parse(await storage.getItem(KEY)), "the saved snapshot").toEqual({ schemaVersion: 1, records: records });
});

test("the date format gives the no-due-date label for null and the same day in every time zone", () => {
  const format = createDateFormat("%%formatLocale%%", "%%noDueDate%%");
  expect(format.day(null), "no due date").toBe("%%noDueDate%%");
  expect(format.day("2026-03-02").includes("2026"), "2026-03-02 → " + format.day("2026-03-02")).toBe(true);
  expect(format.day("2026-03-02").includes("2,") || format.day("2026-03-02").startsWith("2 "), "the 2nd, not the 1st").toBe(true);
  expect(format.day("2026-03-02") === format.day("2026-03-01"), "two days, two texts").toBe(false);
});

test("the due-today count follows the day the clock says, which the list asks again on every return to the app", () => {
  const tasks = [
    { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-02", done: false, priority: "normal" },
    { id: "t-02", title: "%%fixture2Name%%", dueDate: "2026-03-01", done: false, priority: "high" },
  ];
  expect(countDueTasks(tasks, createFixedClock("2026-03-01").today()), "on March 1").toBe(1);
  expect(countDueTasks(tasks, createFixedClock("2026-03-02").today()), "on March 2").toBe(2);
  expect(/^\d{4}-\d{2}-\d{2}$/.test(createSystemClock().today()), "system clock: " + createSystemClock().today()).toBe(true);
});
