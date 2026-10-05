// Tests of tasksReducer in ui/tasksReducer.ts: every action gives a new list (or the same list when
// the domain rejects it), and the list it received is never changed.
import { test, expect } from "./testing.js";
import { tasksReducer } from "../ui/tasksReducer.ts";

// A fresh list for every test.
function sampleTasks() {
  return [
    { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-01", done: false, priority: "high" },
    { id: "t-02", title: "%%fixture2Name%%", dueDate: null, done: true, priority: "low" },
  ];
}

test("tasksReducer adds a valid task with a free id and refuses an invalid one", () => {
  const list = sampleTasks();
  const next = tasksReducer(list, { type: "added", fields: { title: "%%newName%%", dueDate: null, done: false, priority: "normal" } });
  expect(next.length, "tasks after a valid draft").toBe(3);
  expect(next[2].id, "id of the new task").toBe("t-3");
  expect(list.length, "the received list").toBe(2);
  const same = tasksReducer(list, { type: "added", fields: { title: "  ", dueDate: null, done: false, priority: "normal" } });
  expect(same, "an empty title").toBe(list);
});

test("tasksReducer toggles done in a copy and keeps the other tasks as they were", () => {
  const list = sampleTasks();
  const next = tasksReducer(list, { type: "doneToggled", id: "t-01" });
  expect(next[0].done, "toggled task").toBe(true);
  expect(list[0].done, "the task in the received list").toBe(false);
  expect(next[1], "the other task").toBe(list[1]);
  expect(tasksReducer(list, { type: "doneToggled", id: "t-99" }), "an unknown id").toBe(list);
});

test("tasksReducer refuses an invalid update and removes only the given task", () => {
  const list = sampleTasks();
  const refused = tasksReducer(list, { type: "updated", id: "t-01", fields: { title: "%%fixture1Name%%", dueDate: "2026-03-01T10:00", done: false, priority: "high" } });
  expect(refused, "a due date with a time").toBe(list);
  const next = tasksReducer(list, { type: "removed", id: "t-01" });
  expect(next.map((task) => task.id), "ids after removing t-01").toEqual(["t-02"]);
});
