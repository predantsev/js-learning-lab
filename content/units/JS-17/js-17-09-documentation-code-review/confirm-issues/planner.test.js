import { test, expect } from "./testing.js";
import { validateTask, countDue } from "./domain/planner.js";

test("%%tValid%%", () => {
  expect(validateTask({ title: "  %%plants%%  " }).ok, "%%mValid%%").toBe(true);
});

test("%%tEmpty%%", () => {
  expect(validateTask({ title: "   " }).ok, "%%mEmpty%%").toBe(false);
});

test("%%tDue%%", () => {
  const tasks = [
    { id: "t-01", title: "%%plants%%", dueDate: "2026-03-02", done: false },
    { id: "t-02", title: "%%books%%", dueDate: "2026-03-01", done: false },
  ];
  expect(countDue(tasks, "2026-03-01"), "%%mDue%%").toBe(1);
});
