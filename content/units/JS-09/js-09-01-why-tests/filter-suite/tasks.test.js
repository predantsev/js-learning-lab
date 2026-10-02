import { test, expect } from "./testing.js";
import { filterByStatus } from "./tasks.js";

const tasks = [
  { id: "t-01", title: "%%t01%%", done: false },
  { id: "t-04", title: "%%t04%%", done: true },
  { id: "t-05", title: "%%t05%%", done: false },
  { id: "t-06", title: "%%t06%%", done: true },
];

test("%%testDone%%", () => {
  const ids = filterByStatus(tasks, "done").map((task) => task.id);
  expect(ids).toEqual(["t-04", "t-06"]);
});

test("%%testPending%%", () => {
  const ids = filterByStatus(tasks, "pending").map((task) => task.id);
  expect(ids).toEqual(["t-01", "t-05"]);
});

test("%%testAll%%", () => {
  expect(filterByStatus(tasks, "all").length).toBe(4);
});
