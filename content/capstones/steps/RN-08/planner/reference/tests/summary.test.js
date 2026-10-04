// Tests of the CP-RN enhancement's rule (src/summary.ts) under the course runner.
import { test, expect } from "./testing.js";
import { overdueTasks } from "../src/summary.ts";
import { createMemoryStorage } from "../src/adapters.ts";
import { createRepository } from "../src/repository.ts";

const tasks = [
  { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-02-28", done: false, priority: "low" },
  { id: "t-02", title: "%%fixture2Name%%", dueDate: "2026-03-01", done: false, priority: "high" },
  { id: "t-05", title: "%%fixture5Name%%", dueDate: "2026-02-26", done: false, priority: "high" },
  { id: "t-04", title: "%%fixture4Name%%", dueDate: "2026-02-27", done: true, priority: "high" },
  { id: "t-03", title: "%%fixture3Name%%", dueDate: null, done: false, priority: "high" },
];

test("overdue: pending, due strictly before the day, the high priority first, then the earlier date", () => {
  expect(overdueTasks(tasks, "2026-03-01").map((task) => task.id), "on March 1").toEqual(["t-05", "t-01"]);
  expect(overdueTasks(tasks, "2026-03-02").map((task) => task.id), "on March 2").toEqual(["t-05", "t-02", "t-01"]);
});

test("a task done offline and saved leaves the overdue section after a new read", async () => {
  const storage = createMemoryStorage();
  await createRepository(storage, tasks).apply({ type: "doneToggled", id: "t-05" });
  const after = (await createRepository(storage, []).readAll()).records;
  expect(overdueTasks(after, "2026-03-02").map((task) => task.id), "after the change").toEqual(["t-02", "t-01"]);
});
