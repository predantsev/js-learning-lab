import { test, expect } from "./testing.js";
import { sortTasks } from "./tasks.js";

test("%%tOrder%%", () => {
  // Build a few tasks in a mixed order, sort them by "dueDate" and compare the ids of the result.
});

test("%%tUnchanged%%", () => {
  // Sort by "dueDate", then check that the array you passed in still has its old order.
});

test("%%tUnknown%%", () => {
  // Check that sorting by a key that does not exist throws a RangeError.
});
