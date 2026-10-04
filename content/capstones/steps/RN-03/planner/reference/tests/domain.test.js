// Tests of the planner rules in domain/tasks.js. Only pure functions are tested here: no page and
// no storage, so the same file also runs under Node.js.
import { test, expect } from "./testing.js";
import { validateTask, countDueTasks, filterTasks, sortTasks, isCalendarDate, searchKey, searchTasks, indexById, prioritiesInUse, paginate } from "../domain/tasks.ts";

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

test("validateTask accepts only a plain calendar date as the due date", () => {
  expect(validateTask({ title: "%%fixture1Name%%", dueDate: "2026-03-02T10:00" }), "a date with a time").toEqual({ ok: false, errors: { dueDate: "bad-date" } });
  expect(validateTask({ title: "%%fixture1Name%%", dueDate: "02.03.2026" }).ok, "another date format").toBe(false);
  expect(validateTask({ title: "%%fixture1Name%%", dueDate: "2026-03-02" }).ok, "a calendar date").toBe(true);
  expect(isCalendarDate(null), "null is not a calendar date").toBe(false);
});

test("searchKey gives the same key however the text was typed", () => {
  // The same word typed as one character per letter and with a letter + a combining mark.
  expect(searchKey("  %%unicodeWord%% "), "composed").toBe("%%unicodeKey%%");
  expect(searchKey("%%unicodeWordDecomposed%%"), "decomposed").toBe("%%unicodeKey%%");
});

test("searchTasks finds a task whatever the case and the Unicode form", () => {
  const list = [...sampleTasks(), { id: "t-06", title: "%%unicodeWord%%", dueDate: null, done: false, priority: "low" }];
  expect(searchTasks(list, " %%unicodeQuery%% ").map((task) => task.id), "decomposed query").toEqual(["t-06"]);
  expect(searchTasks(list, "").length, "empty query").toBe(list.length);
});

test("indexById and prioritiesInUse build a Map and a Set", () => {
  const list = sampleTasks();
  expect(indexById(list).get(list[1].id), "the second task in the index").toBe(list[1]);
  expect(prioritiesInUse([{ priority: "high" }, { priority: "low" }, { priority: "high" }]).size, "two priorities in use").toBe(2);
});

test("paginate yields pages of at most size, the last one shorter", () => {
  expect([...paginate([1, 2, 3, 4, 5], 2)], "5 items, size 2").toEqual([[1, 2], [3, 4], [5]]);
  expect([...paginate([1, 2, 3, 4], 2)], "4 items, size 2").toEqual([[1, 2], [3, 4]]);
  expect([...paginate([], 2)], "no items").toEqual([]);
});

test("paginate builds the next page only when it is asked for", () => {
  const items = [1, 2, 3];
  const pages = paginate(items, 2);
  pages.next();
  items.push(4);
  expect(pages.next().value, "the second page, built after 4 was added").toEqual([3, 4]);
});

test("indexById works for any records with an id and keeps the first of a repeated id", () => {
  const index = indexById([{ id: "a", step: 1 }, { id: "b", step: 2 }, { id: "a", step: 3 }]);
  expect(index.size, "the number of ids").toBe(2);
  expect(index.get("a").step, "the record kept for the id a").toBe(1);
});
