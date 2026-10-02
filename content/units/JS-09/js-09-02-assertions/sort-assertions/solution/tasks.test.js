import { test, expect } from "./testing.js";
import { sortTasks } from "./tasks.js";

test("%%tOrder%%", () => {
  const tasks = [
    { id: "t-01", title: "%%t01%%", dueDate: "2026-03-02", done: false, priority: "normal" },
    { id: "t-03", title: "%%t03%%", dueDate: null, done: false, priority: "low" },
    { id: "t-02", title: "%%t02%%", dueDate: "2026-03-01", done: false, priority: "high" },
    { id: "t-05", title: "%%t05%%", dueDate: "2026-03-10", done: false, priority: "normal" },
  ];
  const ids = sortTasks(tasks, "dueDate").map((task) => task.id);
  expect(ids, "%%mOrder%%").toEqual(["t-02", "t-01", "t-05", "t-03"]);
});

test("%%tUnchanged%%", () => {
  const tasks = [
    { id: "t-01", title: "%%t01%%", dueDate: "2026-03-02", done: false, priority: "normal" },
    { id: "t-03", title: "%%t03%%", dueDate: null, done: false, priority: "low" },
    { id: "t-02", title: "%%t02%%", dueDate: "2026-03-01", done: false, priority: "high" },
    { id: "t-05", title: "%%t05%%", dueDate: "2026-03-10", done: false, priority: "normal" },
  ];
  sortTasks(tasks, "dueDate");
  const ids = tasks.map((task) => task.id);
  expect(ids, "%%mUnchanged%%").toEqual(["t-01", "t-03", "t-02", "t-05"]);
});

test("%%tUnknown%%", () => {
  const tasks = [
    { id: "t-01", title: "%%t01%%", dueDate: "2026-03-02", done: false, priority: "normal" },
    { id: "t-03", title: "%%t03%%", dueDate: null, done: false, priority: "low" },
    { id: "t-02", title: "%%t02%%", dueDate: "2026-03-01", done: false, priority: "high" },
    { id: "t-05", title: "%%t05%%", dueDate: "2026-03-10", done: false, priority: "normal" },
  ];
  expect(() => sortTasks(tasks, "title"), "%%mUnknown%%").toThrow(RangeError);
});
