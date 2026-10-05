// Characterization tests of the indexed version: it must give exactly what the slow version gave,
// on synthetic data and on small cases written by hand.
import { test, expect } from "./testing.js";
import { dueCountsByDay } from "../domain/tasks.ts";
import { makeSyntheticTasks } from "../data/synthetic.js";

// The slow version, kept as the reference of the behaviour: for every day it filters the whole list
// again, so the work grows with days × tasks.
function slowDueCountsByDay(list) {
  const days = [...new Set(list.filter((task) => !task.done && task.dueDate !== null).map((task) => task.dueDate))].sort();
  return new Map(days.map((day) => [day, list.filter((task) => !task.done && task.dueDate === day).length]));
}

test("dueCountsByDay gives the same counts as the slow version on 600 synthetic tasks", () => {
  const list = makeSyntheticTasks(600);
  expect([...dueCountsByDay(list)], "counts by day").toEqual([...slowDueCountsByDay(list)]);
});

test("dueCountsByDay leaves out done tasks and tasks without a due date", () => {
  const list = [
    { id: "a", title: "%%fixture1Name%%", dueDate: "2026-03-02", done: false, priority: "normal" },
    { id: "b", title: "%%fixture2Name%%", dueDate: "2026-03-02", done: true, priority: "normal" },
    { id: "c", title: "%%fixture3Name%%", dueDate: null, done: false, priority: "normal" },
    { id: "d", title: "%%fixture4Name%%", dueDate: "2026-03-01", done: false, priority: "high" },
  ];
  expect([...dueCountsByDay(list)], "counts by day").toEqual([["2026-03-01", 1], ["2026-03-02", 1]]);
});
