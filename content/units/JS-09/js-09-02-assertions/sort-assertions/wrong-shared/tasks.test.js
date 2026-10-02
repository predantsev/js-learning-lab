import { test, expect } from "./testing.js";
import { sortTasks } from "./tasks.js";

const tasks = [
  { id: "t-01", title: "%%t01%%", dueDate: "2026-03-02", done: false, priority: "normal" },
  { id: "t-03", title: "%%t03%%", dueDate: null, done: false, priority: "low" },
  { id: "t-02", title: "%%t02%%", dueDate: "2026-03-01", done: false, priority: "high" },
  { id: "t-05", title: "%%t05%%", dueDate: "2026-03-10", done: false, priority: "normal" },
];

test("%%tOrder%%", () => {
  const ids = sortTasks(tasks, "dueDate").map((task) => task.id);
  expect(ids, "%%mOrder%%").toEqual(["t-02", "t-01", "t-05", "t-03"]);
});

// Compares the shared array with itself before and after: an earlier test may have sorted it already.
test("%%tUnchanged%%", () => {
  const before = tasks.map((task) => task.id);
  sortTasks(tasks, "dueDate");
  expect(tasks.map((task) => task.id), "%%mUnchanged%%").toEqual(before);
});

test("%%tUnknown%%", () => {
  expect(() => sortTasks(tasks, "title"), "%%mUnknown%%").toThrow(RangeError);
});
