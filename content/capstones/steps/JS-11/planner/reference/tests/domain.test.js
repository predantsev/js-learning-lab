// Tests of the planner rules in domain/tasks.js. Only pure functions are tested here: no page and
// no storage, so the same file also runs under Node.js.
import { test, expect } from "./testing.js";
import { validateTask, countDueTasks, filterTasks, sortTasks } from "../domain/tasks.js";

// "Today" is fixed: the result of a test must not depend on the day it runs.
const TODAY = "2026-03-01";

// A fresh list for every test, so a test that changes it cannot change another test's data.
function sampleTasks() {
  return [
    { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-01", done: false, priority: "normal" },
    { id: "t-02", title: "%%fixture2Name%%", dueDate: "2026-03-02", done: false, priority: "high" },
    { id: "t-03", title: "%%fixture3Name%%", dueDate: null, done: false, priority: "low" },
    { id: "t-04", title: "%%fixture4Name%%", dueDate: "2026-02-27", done: true, priority: "high" },
    { id: "t-05", title: "%%fixture5Name%%", dueDate: "2026-02-28", done: false, priority: "low" },
  ];
}

test("validateTask accepts a title of 80 characters", () => {
  expect(validateTask({ title: "a".repeat(80), priority: "normal" }).ok, "80 characters").toBe(true);
});

test("validateTask rejects a title of 81 characters", () => {
  expect(validateTask({ title: "a".repeat(81), priority: "normal" }), "81 characters").toEqual({ ok: false, errors: { title: "too-long" } });
});

test("validateTask rejects an unknown priority", () => {
  expect(validateTask({ title: "%%fixture1Name%%", priority: "urgent" }), "priority urgent").toEqual({ ok: false, errors: { priority: "unknown" } });
});

test("countDueTasks counts a task due today and one due earlier", () => {
  // t-01 is due today, t-05 yesterday; t-02 is due tomorrow, t-03 has no date, t-04 is done.
  expect(countDueTasks(sampleTasks(), TODAY), "due on " + TODAY).toBe(2);
});

test("countDueTasks does not count a task due tomorrow", () => {
  const list = [{ id: "t-12", title: "%%fixture1Name%%", dueDate: "2026-03-02", done: false, priority: "low" }];
  expect(countDueTasks(list, TODAY), "a task due on 2026-03-02").toBe(0);
});

test("countDueTasks never counts a done task or one without a due date", () => {
  const list = [
    { id: "t-10", title: "%%fixture1Name%%", dueDate: "2026-02-01", done: true, priority: "low" },
    { id: "t-11", title: "%%fixture2Name%%", dueDate: null, done: false, priority: "low" },
  ];
  expect(countDueTasks(list, TODAY), "a done task and a task without a date").toBe(0);
});

test("countDueTasks of an empty list is 0", () => {
  expect(countDueTasks([], TODAY), "empty list").toBe(0);
});

test("filterTasks keeps only the pending or only the done tasks", () => {
  expect(filterTasks(sampleTasks(), "done").map((task) => task.id), "done").toEqual(["t-04"]);
  expect(filterTasks(sampleTasks(), "pending").map((task) => task.id), "pending").toEqual(["t-01", "t-02", "t-03", "t-05"]);
});

test("sortTasks puts earlier due dates first and tasks without a date last", () => {
  const list = sampleTasks();
  expect(sortTasks(list).map((task) => task.id), "sorted ids").toEqual(["t-04", "t-05", "t-01", "t-02", "t-03"]);
  expect(list.map((task) => task.id), "the list passed in").toEqual(["t-01", "t-02", "t-03", "t-04", "t-05"]);
});
