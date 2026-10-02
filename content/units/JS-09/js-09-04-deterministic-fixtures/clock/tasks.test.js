import { test, expect } from "./testing.js";
import { isOverdue } from "./tasks.js";

test("%%tNotOverdue%%", () => {
  const task = { id: "t-01", title: "%%t01%%", dueDate: "2026-03-02", done: false };
  expect(isOverdue(task), "%%mOverdue%%").toBe(false);
});
