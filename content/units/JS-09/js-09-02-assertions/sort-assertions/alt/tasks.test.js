import { test, expect } from "./testing.js";
import { sortTasks } from "./tasks.js";

// Each test builds its own fresh tasks.
function makeTasks() {
  const tasks = [
    { id: "t-01", title: "%%t01%%", dueDate: "2026-03-02", done: false, priority: "normal" },
    { id: "t-03", title: "%%t03%%", dueDate: null, done: false, priority: "low" },
    { id: "t-02", title: "%%t02%%", dueDate: "2026-03-01", done: false, priority: "high" },
    { id: "t-05", title: "%%t05%%", dueDate: "2026-03-10", done: false, priority: "normal" },
  ];
  return tasks;
}

test("%%tOrder%%", () => {
  const dates = sortTasks(makeTasks(), "dueDate").map((task) => task.dueDate);
  expect(dates, "%%mOrder%%").toEqual(["2026-03-01", "2026-03-02", "2026-03-10", null]);
});

test("%%tUnchanged%%", () => {
  const tasks = makeTasks();
  const copy = [...tasks];
  const sorted = sortTasks(tasks, "dueDate");
  expect(tasks, "%%mUnchanged%%").toEqual(copy);
  expect(sorted === tasks, "%%mNewArray%%").toBe(false);
});

test("%%tUnknown%%", () => {
  expect(() => sortTasks(makeTasks(), "colour"), "%%mUnknown%%").toThrow();
});
